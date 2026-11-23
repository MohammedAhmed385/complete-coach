import type { AuthUser, Role } from "@/lib/auth-config";

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const DERIVED_KEY_BITS = 256;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SignedAccountBackup {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  salt: string;
  avatarUrl?: string | null;
  createdAt: string;
  sig: string;
}

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "revive-clinic-auth-hmac-v1-secret-key"
  );
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const clean = hex.trim();
  if (clean.length % 2 !== 0) {
    throw new Error("Invalid hex length");
  }
  const buffer = new ArrayBuffer(clean.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < clean.length; i += 2) {
    const parsed = parseInt(clean.slice(i, i + 2), 16);
    if (Number.isNaN(parsed)) {
      throw new Error("Invalid hex byte");
    }
    bytes[i / 2] = parsed;
  }
  return bytes;
}

export function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function base64UrlDecode(encoded: string): string {
  const base64 = encoded
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPassword(
  password: string,
  existingSaltHex?: string
): Promise<{ hash: string; salt: string }> {
  let saltBytes: Uint8Array<ArrayBuffer>;
  if (existingSaltHex) {
    saltBytes = hexToBytes(existingSaltHex);
  } else {
    const saltBuffer = new ArrayBuffer(SALT_BYTES);
    saltBytes = new Uint8Array(saltBuffer);
    globalThis.crypto.getRandomValues(saltBytes);
  }

  const encoder = new TextEncoder();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    DERIVED_KEY_BITS
  );

  return {
    hash: bytesToHex(new Uint8Array(derivedBits)),
    salt: bytesToHex(saltBytes),
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  saltHex: string
): Promise<boolean> {
  if (!password || !storedHash || !saltHex) return false;
  try {
    const { hash } = await hashPassword(password, saltHex);
    return constantTimeEqual(hash, storedHash);
  } catch {
    return false;
  }
}

async function importHmacKey() {
  const encoder = new TextEncoder();
  return globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signHmac(message: string): Promise<string> {
  const key = await importHmacKey();
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return bytesToHex(new Uint8Array(signature));
}

export async function verifyHmac(
  message: string,
  sigHex: string
): Promise<boolean> {
  if (!message || !sigHex) return false;
  try {
    const expectedSig = await signHmac(message);
    return constantTimeEqual(expectedSig, sigHex);
  } catch {
    return false;
  }
}

interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  exp: number;
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  const payload: SessionPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || null,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const sig = await signHmac(encodedPayload);
  return `${encodedPayload}.${sig}`;
}

export async function verifySessionToken(
  token?: string | null
): Promise<AuthUser | null> {
  if (!token || typeof token !== "string") return null;
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0 || dotIdx === token.length - 1) return null;

  const encodedPayload = token.slice(0, dotIdx);
  const sigHex = token.slice(dotIdx + 1);

  const isValidSig = await verifyHmac(encodedPayload, sigHex);
  if (!isValidSig) return null;

  try {
    const parsed = JSON.parse(
      base64UrlDecode(encodedPayload)
    ) as SessionPayload;
    if (!parsed || !parsed.email || !parsed.id || !parsed.role) return null;
    if (typeof parsed.exp !== "number" || parsed.exp <= Date.now()) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      avatarUrl: parsed.avatarUrl || null,
    };
  } catch {
    return null;
  }
}

function buildAccountBackupSigningMessage(
  account: Omit<SignedAccountBackup, "sig">
): string {
  return `${account.id}|${account.email.toLowerCase().trim()}|${account.role}|${account.passwordHash}|${account.salt}`;
}

export async function createSignedAccountBackup(
  account: Omit<SignedAccountBackup, "sig">
): Promise<SignedAccountBackup> {
  const msg = buildAccountBackupSigningMessage(account);
  const sig = await signHmac(msg);
  return {
    ...account,
    sig,
  };
}

export async function verifySignedAccountBackup(
  backup: unknown
): Promise<SignedAccountBackup | null> {
  if (!backup || typeof backup !== "object") return null;
  const candidate = backup as Partial<SignedAccountBackup>;
  if (
    !candidate.id ||
    !candidate.email ||
    !candidate.role ||
    !candidate.passwordHash ||
    !candidate.salt ||
    !candidate.sig ||
    !candidate.name
  ) {
    return null;
  }

  const base: Omit<SignedAccountBackup, "sig"> = {
    id: String(candidate.id),
    name: String(candidate.name),
    email: String(candidate.email),
    role: candidate.role,
    passwordHash: String(candidate.passwordHash),
    salt: String(candidate.salt),
    avatarUrl: candidate.avatarUrl || null,
    createdAt: candidate.createdAt
      ? String(candidate.createdAt)
      : new Date().toISOString(),
  };

  const valid = await verifyHmac(
    buildAccountBackupSigningMessage(base),
    String(candidate.sig)
  );
  if (!valid) return null;

  return {
    ...base,
    sig: String(candidate.sig),
  };
}
