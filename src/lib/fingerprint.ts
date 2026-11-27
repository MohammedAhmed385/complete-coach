/**
 * Brave-Resilient Persistent Visitor Identity & Unique Per-Tab Session Generator
 *
 * Key Guarantees (matching D:\sentance architecture):
 * 1. `getOrCreateVisitorIdentity()` checks `localStorage` and `document.cookie` FIRST
 *    so Brave's Canvas/WebGL farbling never creates duplicate visitor IDs across reloads.
 * 2. `createTabSessionId()` NEVER uses `sessionStorage` (which browsers clone when a user
 *    clicks "Duplicate Tab"), guaranteeing every open browser tab gets its own unique ID.
 */

const VISITOR_STORAGE_KEY = "revive_vid_v2";
const VISITOR_COOKIE_NAME = "revive_vid";

async function sha256Hex(input: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch * 31;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"
    )
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeDays = 365): void {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function generateRandomHex(byteLen = 16): string {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(byteLen);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`;
}

let cachedIdentity: { visitorId: string; fingerprintHash: string } | null = null;

export async function getOrCreateVisitorIdentity(): Promise<{
  visitorId: string;
  fingerprintHash: string;
}> {
  if (cachedIdentity) return cachedIdentity;

  const nav = typeof navigator !== "undefined" ? navigator : null;
  const scr = typeof screen !== "undefined" ? screen : null;
  const tz =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      : "UTC";

  // Deterministic, non-farbled hardware & locale signals (immune to Brave Canvas noise)
  const stableSignals = [
    nav?.language || "",
    String(nav?.hardwareConcurrency || 0),
    String(nav?.maxTouchPoints || 0),
    scr ? `${scr.width}x${scr.height}x${scr.colorDepth}` : "",
    tz,
  ].join("|");

  const fingerprintHash = (await sha256Hex(stableSignals)).slice(0, 32);

  let storedVid = "";
  try {
    storedVid = localStorage.getItem(VISITOR_STORAGE_KEY) || "";
  } catch {
    // Ignore storage restriction
  }
  if (!storedVid) {
    storedVid = readCookie(VISITOR_COOKIE_NAME) || "";
  }

  const isValidVid = /^v_[a-z0-9]{16,40}$/i.test(storedVid);
  const visitorId = isValidVid ? storedVid : `v_${generateRandomHex(14)}`;

  try {
    localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  } catch {
    // Ignore storage quota
  }
  writeCookie(VISITOR_COOKIE_NAME, visitorId, 365);

  cachedIdentity = { visitorId, fingerprintHash };
  return cachedIdentity;
}

/**
 * Generates a strictly unique in-memory ID per browser tab instance.
 * Never reads `sessionStorage` so duplicated tabs never collide or delete each other.
 */
export function createTabSessionId(): string {
  return `s_${generateRandomHex(12)}`;
}
