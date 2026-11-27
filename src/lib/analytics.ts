import * as fs from "fs";
import * as path from "path";
import { isBot, parseBrowser, parseDevice, parseOS } from "./utils";
import { checkIsAdminEmail, Role } from "./auth-config";
import { getLiveAuthUsersAsync } from "./live-store";

export const STALE_PRESENCE_WINDOW_MS = 45_000;

export type AnalyticsRange = "24h" | "7d" | "30d" | "90d";
export type StorageMode = "d1" | "kv" | "local";

export interface LivePresenceEntry {
  sessionId: string;
  visitorId: string;
  fingerprintHash: string;
  uid: string | null;
  isAuthenticated: boolean;
  role: Role | "GUEST";
  email: string;
  displayName: string;
  currentPath: string;
  currentActivity: string;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  device: string;
  browser: string;
  os: string;
  online: boolean;
  sessionStartedAt: number;
  lastActive: number;
  pageCount: number;
  elapsedSeconds: number;
  lastSeenSecondsAgo: number;
}

export interface UniqueVisitorEntry {
  visitorId: string;
  fingerprintHash: string;
  isAuthenticated: boolean;
  uid: string | null;
  email: string | null;
  displayName: string;
  country: string;
  countryCode: string;
  city: string;
  device: string;
  browser: string;
  os: string;
  visitCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface RealPageVisit {
  id: string;
  visitorId: string;
  sessionId: string;
  fingerprintHash: string;
  uid: string | null;
  email: string | null;
  displayName: string;
  page: string;
  referrer: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  countryCode: string;
  city: string;
  ip: string;
  createdAtMs: number;
  createdAt: string;
}

export interface SessionHistoryEntry {
  sessionId: string;
  visitorId: string;
  startedAt: string;
  lastActiveAt: string;
  pageCount: number;
  durationSec: number;
}

export interface RegisteredAccountSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface HeartbeatInput {
  sessionId: string;
  visitorId: string;
  fingerprintHash: string;
  uid: string | null;
  isAuthenticated: boolean;
  role: Role | "GUEST";
  email: string;
  displayName: string;
  currentPath: string;
  currentActivity: string;
  referrer?: string;
  registerVisit?: boolean;
  recordPageView?: boolean;
  userAgent: string;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
}

export interface RealTelemetryPayload {
  serverNow: number;
  storageMode: StorageMode;
  liveSessions: LivePresenceEntry[];
  uniqueLiveSummary: {
    uniqueOnlineCount: number;
    signedInOnlineCount: number;
    guestOnlineCount: number;
    openTabsCount: number;
  };
  uniqueBreakdown: {
    totalUnique: number;
    registeredCount: number;
    guestCount: number;
    conversionPct: number;
  };
  registeredUsers: RegisteredAccountSummary[];
  uniqueVisitorsList: UniqueVisitorEntry[];
  kpis: {
    totalVisits: number;
    uniqueVisitors: number;
    todayVisits: number;
    todayUnique: number;
    liveActive: number;
    openTabsCount: number;
    avgDuration: number;
    bounceRate: number;
    prevVisits: number;
    prevUnique: number;
    visitChange: number;
    uniqueChange: number;
  };
  timeSeries: Array<{
    date: string;
    visits: number;
    unique: number;
  }>;
  topPages: Array<{ page: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  devices: Array<{ device: string; count: number }>;
  browsers: Array<{ browser: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  recentVisits: RealPageVisit[];
}

// ──────────────────────────────────────────────
// GEO & IP PRIVACY HELPERS (MATCHING D:\sentance)
// ──────────────────────────────────────────────

export const COUNTRY_NAMES: Record<string, string> = {
  EG: "Egypt",
  SA: "Saudi Arabia",
  AE: "United Arab Emirates",
  KW: "Kuwait",
  QA: "Qatar",
  BH: "Bahrain",
  OM: "Oman",
  JO: "Jordan",
  IQ: "Iraq",
  LB: "Lebanon",
  PS: "Palestine",
  SY: "Syria",
  YE: "Yemen",
  SD: "Sudan",
  LY: "Libya",
  TN: "Tunisia",
  DZ: "Algeria",
  MA: "Morocco",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  TR: "Türkiye",
  IN: "India",
  PK: "Pakistan",
  BR: "Brazil",
  MX: "Mexico",
  JP: "Japan",
  KR: "South Korea",
  SG: "Singapore",
};

export function maskIp(rawIp?: string | null): string {
  const ip = String(rawIp || "").split(",")[0].trim();
  if (!ip || ip === "::1" || ip === "127.0.0.1") return "127.0.0.1";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    return `${parts.slice(0, 3).join(":")}:xxxx`;
  }
  return "Masked";
}

export function extractGeoFromHeaders(
  headers: Headers,
  cf?: Record<string, any> | null
): {
  ip: string;
  countryCode: string;
  country: string;
  city: string;
} {
  const rawIp =
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for") ||
    headers.get("x-real-ip") ||
    "127.0.0.1";

  const rawCode = String(
    cf?.country ||
      headers.get("cf-ipcountry") ||
      headers.get("x-vercel-ip-country") ||
      "LOCAL"
  )
    .toUpperCase()
    .trim();

  const countryCode =
    rawCode && rawCode !== "XX" && rawCode !== "T1" ? rawCode : "LOCAL";
  const country =
    countryCode === "LOCAL"
      ? "Direct / Local"
      : COUNTRY_NAMES[countryCode] || countryCode;

  const city = String(
    cf?.city || headers.get("cf-ipcity") || headers.get("x-vercel-ip-city") || ""
  )
    .trim()
    .slice(0, 48);

  return {
    ip: maskIp(rawIp),
    countryCode,
    country,
    city,
  };
}

// ──────────────────────────────────────────────
// RUNTIME BINDINGS: D1 -> KV -> LOCAL FS / MEMORY
// ──────────────────────────────────────────────

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = any>(): Promise<{ results?: T[] }>;
  first<T = any>(): Promise<T | null>;
  run(): Promise<any>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<any[]>;
}

interface CloudflareKVNamespace {
  get(key: string, type?: "json" | "text"): Promise<any>;
  put(key: string, value: string): Promise<void>;
}

async function getCloudflareRuntime(): Promise<{
  db: D1Database | null;
  kv: CloudflareKVNamespace | null;
  cf: Record<string, any> | null;
}> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const env = (ctx?.env || {}) as Record<string, any>;
    const db =
      env.DB && typeof env.DB.prepare === "function"
        ? (env.DB as D1Database)
        : null;
    const rawKv = env.REVIVE_KV || env.DATA_KV || env.KV;
    const kv =
      rawKv && typeof rawKv.get === "function" && typeof rawKv.put === "function"
        ? (rawKv as CloudflareKVNamespace)
        : null;
    return {
      db,
      kv,
      cf: ((ctx as any)?.cf as Record<string, any>) || null,
    };
  } catch {
    return { db: null, kv: null, cf: null };
  }
}

export async function getCloudflareRequestCf(): Promise<Record<string, any> | null> {
  const { cf } = await getCloudflareRuntime();
  return cf;
}

let d1SchemaInitialized = false;

async function ensureD1Schema(db: D1Database): Promise<void> {
  if (d1SchemaInitialized) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS live_presence (
      session_id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      uid TEXT,
      is_authenticated INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'GUEST',
      email TEXT NOT NULL DEFAULT 'Guest',
      display_name TEXT NOT NULL DEFAULT 'زائر',
      current_path TEXT NOT NULL DEFAULT '/',
      current_activity TEXT NOT NULL DEFAULT 'الرئيسية',
      ip TEXT NOT NULL DEFAULT '127.0.0.1',
      country TEXT NOT NULL DEFAULT 'Direct / Edge',
      country_code TEXT NOT NULL DEFAULT 'LOCAL',
      city TEXT NOT NULL DEFAULT '',
      device TEXT NOT NULL DEFAULT 'desktop',
      browser TEXT NOT NULL DEFAULT 'Chrome',
      os TEXT NOT NULL DEFAULT 'Windows',
      session_started_at INTEGER NOT NULL,
      last_active INTEGER NOT NULL,
      page_count INTEGER NOT NULL DEFAULT 1
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS unique_visitors (
      visitor_id TEXT PRIMARY KEY,
      fingerprint_hash TEXT NOT NULL,
      is_authenticated INTEGER NOT NULL DEFAULT 0,
      uid TEXT,
      email TEXT,
      display_name TEXT NOT NULL DEFAULT 'زائر',
      country TEXT NOT NULL DEFAULT 'Direct / Edge',
      country_code TEXT NOT NULL DEFAULT 'LOCAL',
      city TEXT NOT NULL DEFAULT '',
      device TEXT NOT NULL DEFAULT 'desktop',
      browser TEXT NOT NULL DEFAULT 'Chrome',
      os TEXT NOT NULL DEFAULT 'Windows',
      visit_count INTEGER NOT NULL DEFAULT 1,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS page_visits (
      id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      fingerprint_hash TEXT NOT NULL,
      uid TEXT,
      email TEXT,
      display_name TEXT NOT NULL DEFAULT 'زائر',
      page TEXT NOT NULL,
      referrer TEXT NOT NULL DEFAULT 'Direct',
      device TEXT NOT NULL DEFAULT 'desktop',
      browser TEXT NOT NULL DEFAULT 'Chrome',
      os TEXT NOT NULL DEFAULT 'Windows',
      country TEXT NOT NULL DEFAULT 'Direct / Edge',
      country_code TEXT NOT NULL DEFAULT 'LOCAL',
      city TEXT NOT NULL DEFAULT '',
      ip TEXT NOT NULL DEFAULT '127.0.0.1',
      created_at_ms INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS session_history (
      session_id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL,
      page_count INTEGER NOT NULL DEFAULT 1,
      duration_sec INTEGER NOT NULL DEFAULT 0
    )`),
  ]);
  d1SchemaInitialized = true;
}

// ──────────────────────────────────────────────
// LOCAL FS + ISOLATE MEMORY FALLBACK STORE
// ──────────────────────────────────────────────

function getSafeDataDir(): string | null {
  try {
    if (typeof process !== "undefined" && typeof process.cwd === "function") {
      return path.join(process.cwd(), "data");
    }
  } catch {
    // Non-Node runtime
  }
  return null;
}

function safeReadJson<T>(filename: string, fallback: T): T {
  try {
    const dir = getSafeDataDir();
    if (!dir) return fallback;
    const fp = path.join(dir, filename);
    if (typeof fs !== "undefined" && fs.existsSync(fp)) {
      const raw = fs.readFileSync(fp, "utf8");
      if (raw) return JSON.parse(raw) as T;
    }
  } catch {
    // Edge FS unsupported
  }
  return fallback;
}

function safeWriteJson(filename: string, value: unknown): void {
  try {
    const dir = getSafeDataDir();
    if (!dir) return;
    if (typeof fs !== "undefined" && typeof fs.writeFileSync === "function") {
      if (!fs.existsSync(dir) && typeof fs.mkdirSync === "function") {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, filename), JSON.stringify(value), "utf8");
    }
  } catch {
    // Ignore EROFS in Workers
  }
}

interface StoredPresenceRow {
  sessionId: string;
  visitorId: string;
  fingerprintHash: string;
  uid: string | null;
  isAuthenticated: boolean;
  role: Role | "GUEST";
  email: string;
  displayName: string;
  currentPath: string;
  currentActivity: string;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  device: string;
  browser: string;
  os: string;
  sessionStartedAt: number;
  lastActive: number;
  pageCount: number;
}

let memoryPresence: StoredPresenceRow[] = [];
let memoryVisitors: UniqueVisitorEntry[] = [];
let memoryVisits: RealPageVisit[] = [];
let memorySessions: SessionHistoryEntry[] = [];
let localLoaded = false;

function ensureLocalLoaded() {
  if (localLoaded) return;
  memoryPresence = safeReadJson<StoredPresenceRow[]>("telemetry_presence.json", []);
  memoryVisitors = safeReadJson<UniqueVisitorEntry[]>("telemetry_visitors.json", []);
  memoryVisits = safeReadJson<RealPageVisit[]>("telemetry_visits.json", []);
  memorySessions = safeReadJson<SessionHistoryEntry[]>("telemetry_sessions.json", []);
  localLoaded = true;
}

async function loadStateFromKv(kv: CloudflareKVNamespace) {
  const [p, v, pv, sh] = await Promise.all([
    kv.get("telemetry_presence", "json").catch(() => null),
    kv.get("telemetry_visitors", "json").catch(() => null),
    kv.get("telemetry_visits", "json").catch(() => null),
    kv.get("telemetry_sessions", "json").catch(() => null),
  ]);
  if (Array.isArray(p)) memoryPresence = p as StoredPresenceRow[];
  if (Array.isArray(v)) memoryVisitors = v as UniqueVisitorEntry[];
  if (Array.isArray(pv)) memoryVisits = pv as RealPageVisit[];
  if (Array.isArray(sh)) memorySessions = sh as SessionHistoryEntry[];
  localLoaded = true;
}

async function persistState(kv: CloudflareKVNamespace | null) {
  safeWriteJson("telemetry_presence.json", memoryPresence);
  safeWriteJson("telemetry_visitors.json", memoryVisitors);
  safeWriteJson("telemetry_visits.json", memoryVisits);
  safeWriteJson("telemetry_sessions.json", memorySessions);
  if (kv) {
    await Promise.all([
      kv.put("telemetry_presence", JSON.stringify(memoryPresence)).catch(() => {}),
      kv.put("telemetry_visitors", JSON.stringify(memoryVisitors)).catch(() => {}),
      kv.put("telemetry_visits", JSON.stringify(memoryVisits)).catch(() => {}),
      kv.put("telemetry_sessions", JSON.stringify(memorySessions)).catch(() => {}),
    ]);
  }
}

// ──────────────────────────────────────────────
// CORE PRESENCE & VISIT MUTATIONS
// ──────────────────────────────────────────────

export async function handlePresenceLeave(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const serverNow = Date.now();
  const nowIso = new Date(serverNow).toISOString();
  const { db, kv } = await getCloudflareRuntime();

  if (db) {
    try {
      await ensureD1Schema(db);
      const existing = await db
        .prepare("SELECT session_started_at, page_count FROM live_presence WHERE session_id = ?")
        .bind(sessionId)
        .first<{ session_started_at: number; page_count: number }>();

      const stmts = [
        db.prepare("DELETE FROM live_presence WHERE session_id = ?").bind(sessionId),
      ];
      if (existing) {
        const durSec = Math.max(
          0,
          Math.floor((serverNow - Number(existing.session_started_at || serverNow)) / 1000)
        );
        stmts.push(
          db
            .prepare(
              `UPDATE session_history SET last_active_at = ?, duration_sec = ?, page_count = ? WHERE session_id = ?`
            )
            .bind(nowIso, durSec, Number(existing.page_count || 1), sessionId)
        );
      }
      await db.batch(stmts);
      return;
    } catch (err) {
      console.warn("D1 leave fallback to KV/local:", err);
    }
  }

  ensureLocalLoaded();
  if (kv) await loadStateFromKv(kv);

  const existing = memoryPresence.find((p) => p.sessionId === sessionId);
  if (existing) {
    const durSec = Math.max(
      0,
      Math.floor((serverNow - existing.sessionStartedAt) / 1000)
    );
    const shIdx = memorySessions.findIndex((s) => s.sessionId === sessionId);
    if (shIdx >= 0) {
      memorySessions[shIdx] = {
        ...memorySessions[shIdx],
        lastActiveAt: nowIso,
        durationSec: durSec,
        pageCount: existing.pageCount,
      };
    }
  }
  memoryPresence = memoryPresence.filter((p) => p.sessionId !== sessionId);
  await persistState(kv);
}

export async function handlePresenceHeartbeat(
  input: HeartbeatInput
): Promise<{ ok: boolean; ignored?: boolean; serverNow: number }> {
  const serverNow = Date.now();
  const nowIso = new Date(serverNow).toISOString();
  const staleCutoff = serverNow - STALE_PRESENCE_WINDOW_MS;

  if (isBot(input.userAgent || "")) {
    return { ok: true, ignored: true, serverNow };
  }

  const device = parseDevice(input.userAgent || "");
  const browser = parseBrowser(input.userAgent || "");
  const os = parseOS(input.userAgent || "");
  const referrer = (input.referrer || "Direct").trim().slice(0, 120) || "Direct";
  const recordView = Boolean(input.recordPageView);
  const registerVisit = Boolean(input.registerVisit);

  const { db, kv } = await getCloudflareRuntime();

  if (db) {
    try {
      await ensureD1Schema(db);
      const existingSession = await db
        .prepare(
          "SELECT session_started_at, page_count FROM live_presence WHERE session_id = ?"
        )
        .bind(input.sessionId)
        .first<{ session_started_at: number; page_count: number }>();

      const startedAtMs = existingSession
        ? Number(existingSession.session_started_at)
        : serverNow;
      const nextPageCount = existingSession
        ? Number(existingSession.page_count || 1) + (recordView ? 1 : 0)
        : 1;
      const durationSec = Math.max(0, Math.floor((serverNow - startedAtMs) / 1000));

      const statements = [
        db
          .prepare(
            `INSERT INTO live_presence (
              session_id, visitor_id, uid, is_authenticated, role, email, display_name,
              current_path, current_activity, ip, country, country_code, city,
              device, browser, os, session_started_at, last_active, page_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
              visitor_id = excluded.visitor_id,
              uid = excluded.uid,
              is_authenticated = excluded.is_authenticated,
              role = excluded.role,
              email = excluded.email,
              display_name = excluded.display_name,
              current_path = excluded.current_path,
              current_activity = excluded.current_activity,
              ip = excluded.ip,
              country = excluded.country,
              country_code = excluded.country_code,
              city = excluded.city,
              device = excluded.device,
              browser = excluded.browser,
              os = excluded.os,
              last_active = excluded.last_active,
              page_count = ?`
          )
          .bind(
            input.sessionId,
            input.visitorId,
            input.uid,
            input.isAuthenticated ? 1 : 0,
            input.role,
            input.email,
            input.displayName,
            input.currentPath,
            input.currentActivity,
            input.ip,
            input.country,
            input.countryCode,
            input.city,
            device,
            browser,
            os,
            startedAtMs,
            serverNow,
            nextPageCount,
            nextPageCount
          ),
        db
          .prepare("DELETE FROM live_presence WHERE last_active < ?")
          .bind(staleCutoff),
        db
          .prepare(
            `INSERT INTO session_history (session_id, visitor_id, started_at, last_active_at, page_count, duration_sec)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(session_id) DO UPDATE SET
               last_active_at = excluded.last_active_at,
               page_count = excluded.page_count,
               duration_sec = excluded.duration_sec`
          )
          .bind(
            input.sessionId,
            input.visitorId,
            new Date(startedAtMs).toISOString(),
            nowIso,
            nextPageCount,
            durationSec
          ),
      ];

      if (registerVisit) {
        const existingVis = await db
          .prepare("SELECT last_seen_at FROM unique_visitors WHERE visitor_id = ?")
          .bind(input.visitorId)
          .first<{ last_seen_at: string }>();
        const lastSeenMs = existingVis?.last_seen_at
          ? Date.parse(existingVis.last_seen_at)
          : 0;
        const bumpIncrement =
          !existingVis || Number.isNaN(lastSeenMs) || serverNow - lastSeenMs > 8_000
            ? 1
            : 0;

        statements.push(
          db
            .prepare(
              `INSERT INTO unique_visitors (
                visitor_id, fingerprint_hash, is_authenticated, uid, email, display_name,
                country, country_code, city, device, browser, os, visit_count, first_seen_at, last_seen_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
              ON CONFLICT(visitor_id) DO UPDATE SET
                fingerprint_hash = excluded.fingerprint_hash,
                is_authenticated = MAX(unique_visitors.is_authenticated, excluded.is_authenticated),
                uid = COALESCE(excluded.uid, unique_visitors.uid),
                email = COALESCE(excluded.email, unique_visitors.email),
                display_name = excluded.display_name,
                country = excluded.country,
                country_code = excluded.country_code,
                city = excluded.city,
                device = excluded.device,
                browser = excluded.browser,
                os = excluded.os,
                visit_count = unique_visitors.visit_count + ?,
                last_seen_at = excluded.last_seen_at`
            )
            .bind(
              input.visitorId,
              input.fingerprintHash,
              input.isAuthenticated ? 1 : 0,
              input.uid,
              input.isAuthenticated ? input.email : null,
              input.displayName,
              input.country,
              input.countryCode,
              input.city,
              device,
              browser,
              os,
              nowIso,
              nowIso,
              bumpIncrement
            )
        );
      }

      if (recordView) {
        const visitId = `pv-${serverNow}-${crypto.randomUUID().slice(0, 8)}`;
        statements.push(
          db
            .prepare(
              `INSERT INTO page_visits (
                id, visitor_id, session_id, fingerprint_hash, uid, email, display_name,
                page, referrer, device, browser, os, country, country_code, city, ip,
                created_at_ms, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              visitId,
              input.visitorId,
              input.sessionId,
              input.fingerprintHash,
              input.uid,
              input.isAuthenticated ? input.email : null,
              input.displayName,
              input.currentPath,
              referrer,
              device,
              browser,
              os,
              input.country,
              input.countryCode,
              input.city,
              input.ip,
              serverNow,
              nowIso
            )
        );
      }

      await db.batch(statements);
      return { ok: true, serverNow };
    } catch (err) {
      console.warn("D1 heartbeat fallback to KV/local:", err);
    }
  }

  ensureLocalLoaded();
  if (kv) await loadStateFromKv(kv);

  const existingIdx = memoryPresence.findIndex(
    (p) => p.sessionId === input.sessionId
  );
  const prevRow = existingIdx >= 0 ? memoryPresence[existingIdx] : null;
  const startedAtMs = prevRow ? prevRow.sessionStartedAt : serverNow;
  const nextPageCount = prevRow
    ? prevRow.pageCount + (recordView ? 1 : 0)
    : 1;
  const durationSec = Math.max(0, Math.floor((serverNow - startedAtMs) / 1000));

  const nextPresence: StoredPresenceRow = {
    sessionId: input.sessionId,
    visitorId: input.visitorId,
    fingerprintHash: input.fingerprintHash,
    uid: input.uid,
    isAuthenticated: input.isAuthenticated,
    role: input.role,
    email: input.email,
    displayName: input.displayName,
    currentPath: input.currentPath,
    currentActivity: input.currentActivity,
    ip: input.ip,
    country: input.country,
    countryCode: input.countryCode,
    city: input.city,
    device,
    browser,
    os,
    sessionStartedAt: startedAtMs,
    lastActive: serverNow,
    pageCount: nextPageCount,
  };

  if (existingIdx >= 0) {
    memoryPresence[existingIdx] = nextPresence;
  } else {
    memoryPresence.unshift(nextPresence);
  }
  memoryPresence = memoryPresence.filter((p) => p.lastActive >= staleCutoff);

  const shIdx = memorySessions.findIndex((s) => s.sessionId === input.sessionId);
  const shEntry: SessionHistoryEntry = {
    sessionId: input.sessionId,
    visitorId: input.visitorId,
    startedAt: new Date(startedAtMs).toISOString(),
    lastActiveAt: nowIso,
    pageCount: nextPageCount,
    durationSec,
  };
  if (shIdx >= 0) {
    memorySessions[shIdx] = shEntry;
  } else {
    memorySessions.unshift(shEntry);
    if (memorySessions.length > 1000) memorySessions = memorySessions.slice(0, 1000);
  }

  if (registerVisit) {
    const vIdx = memoryVisitors.findIndex((v) => v.visitorId === input.visitorId);
    if (vIdx >= 0) {
      const existingVis = memoryVisitors[vIdx];
      const lastSeenMs = Date.parse(existingVis.lastSeenAt || "");
      const bump =
        Number.isNaN(lastSeenMs) || serverNow - lastSeenMs > 8_000 ? 1 : 0;
      memoryVisitors[vIdx] = {
        ...existingVis,
        fingerprintHash: input.fingerprintHash,
        isAuthenticated: existingVis.isAuthenticated || input.isAuthenticated,
        uid: input.uid || existingVis.uid,
        email: input.isAuthenticated ? input.email : existingVis.email,
        displayName: input.displayName,
        country: input.country,
        countryCode: input.countryCode,
        city: input.city,
        device,
        browser,
        os,
        visitCount: existingVis.visitCount + bump,
        lastSeenAt: nowIso,
      };
    } else {
      memoryVisitors.unshift({
        visitorId: input.visitorId,
        fingerprintHash: input.fingerprintHash,
        isAuthenticated: input.isAuthenticated,
        uid: input.uid,
        email: input.isAuthenticated ? input.email : null,
        displayName: input.displayName,
        country: input.country,
        countryCode: input.countryCode,
        city: input.city,
        device,
        browser,
        os,
        visitCount: 1,
        firstSeenAt: nowIso,
        lastSeenAt: nowIso,
      });
      if (memoryVisitors.length > 2000) memoryVisitors = memoryVisitors.slice(0, 2000);
    }
  }

  if (recordView) {
    const visit: RealPageVisit = {
      id: `pv-${serverNow}-${crypto.randomUUID().slice(0, 8)}`,
      visitorId: input.visitorId,
      sessionId: input.sessionId,
      fingerprintHash: input.fingerprintHash,
      uid: input.uid,
      email: input.isAuthenticated ? input.email : null,
      displayName: input.displayName,
      page: input.currentPath,
      referrer,
      device,
      browser,
      os,
      country: input.country,
      countryCode: input.countryCode,
      city: input.city,
      ip: input.ip,
      createdAtMs: serverNow,
      createdAt: nowIso,
    };
    memoryVisits.unshift(visit);
    if (memoryVisits.length > 2000) memoryVisits = memoryVisits.slice(0, 2000);
  }

  await persistState(kv);
  return { ok: true, serverNow };
}

// ──────────────────────────────────────────────
// REAL ANALYTICS QUERY & AGGREGATION ENGINE
// ──────────────────────────────────────────────

function getRangeWindowMs(range: AnalyticsRange): { days: number; windowMs: number } {
  switch (range) {
    case "24h":
      return { days: 1, windowMs: 24 * 60 * 60 * 1000 };
    case "30d":
      return { days: 30, windowMs: 30 * 24 * 60 * 60 * 1000 };
    case "90d":
      return { days: 90, windowMs: 90 * 24 * 60 * 60 * 1000 };
    case "7d":
    default:
      return { days: 7, windowMs: 7 * 24 * 60 * 60 * 1000 };
  }
}

function buildRealTimeSeries(
  visits: RealPageVisit[],
  range: AnalyticsRange,
  serverNow: number
): Array<{ date: string; visits: number; unique: number }> {
  const { days } = getRangeWindowMs(range);
  const series: Array<{ date: string; visits: number; unique: number }> = [];

  if (range === "24h") {
    const hourMs = 60 * 60 * 1000;
    const currentHourStart = Math.floor(serverNow / hourMs) * hourMs;
    for (let i = 23; i >= 0; i--) {
      const bucketStart = currentHourStart - i * hourMs;
      const bucketEnd = bucketStart + hourMs;
      const bucketVisits = visits.filter(
        (v) => v.createdAtMs >= bucketStart && v.createdAtMs < bucketEnd
      );
      const uniqueSet = new Set(bucketVisits.map((v) => v.visitorId));
      series.push({
        date: new Date(bucketStart).toISOString(),
        visits: bucketVisits.length,
        unique: uniqueSet.size,
      });
    }
    return series;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const nowDate = new Date(serverNow);
  const todayUtcStart = Date.UTC(
    nowDate.getUTCFullYear(),
    nowDate.getUTCMonth(),
    nowDate.getUTCDate()
  );

  for (let i = days - 1; i >= 0; i--) {
    const bucketStart = todayUtcStart - i * dayMs;
    const bucketEnd = bucketStart + dayMs;
    const bucketVisits = visits.filter(
      (v) => v.createdAtMs >= bucketStart && v.createdAtMs < bucketEnd
    );
    const uniqueSet = new Set(bucketVisits.map((v) => v.visitorId));
    series.push({
      date: new Date(bucketStart).toISOString().slice(0, 10),
      visits: bucketVisits.length,
      unique: uniqueSet.size,
    });
  }

  return series;
}

export async function getRealAnalyticsTelemetry(
  range: AnalyticsRange = "7d"
): Promise<RealTelemetryPayload> {
  const serverNow = Date.now();
  const staleCutoff = serverNow - STALE_PRESENCE_WINDOW_MS;
  const { windowMs } = getRangeWindowMs(range);
  const startMs = serverNow - windowMs;
  const prevStartMs = startMs - windowMs;

  const nowDate = new Date(serverNow);
  const todayStartMs = Date.UTC(
    nowDate.getUTCFullYear(),
    nowDate.getUTCMonth(),
    nowDate.getUTCDate()
  );

  const { db, kv } = await getCloudflareRuntime();

  let storageMode: StorageMode = "local";
  let rawPresence: StoredPresenceRow[] = [];
  let rawVisitors: UniqueVisitorEntry[] = [];
  let rawVisits: RealPageVisit[] = [];
  let rawSessions: SessionHistoryEntry[] = [];

  if (db) {
    try {
      await ensureD1Schema(db);
      const [, presRes, visRes, pvRes, shRes] = await db.batch([
        db.prepare("DELETE FROM live_presence WHERE last_active < ?").bind(staleCutoff),
        db
          .prepare(
            "SELECT * FROM live_presence WHERE last_active >= ? ORDER BY session_started_at DESC LIMIT 250"
          )
          .bind(staleCutoff),
        db.prepare("SELECT * FROM unique_visitors ORDER BY last_seen_at DESC LIMIT 2000"),
        db
          .prepare(
            "SELECT * FROM page_visits WHERE created_at_ms >= ? ORDER BY created_at_ms DESC LIMIT 5000"
          )
          .bind(prevStartMs),
        db.prepare("SELECT * FROM session_history ORDER BY started_at DESC LIMIT 2000"),
      ]);

      storageMode = "d1";
      rawPresence = (presRes.results || []).map((r: any) => ({
        sessionId: String(r.session_id),
        visitorId: String(r.visitor_id),
        fingerprintHash: "",
        uid: r.uid ? String(r.uid) : null,
        isAuthenticated: Number(r.is_authenticated) === 1,
        role: (r.role as Role | "GUEST") || "GUEST",
        email: String(r.email || "Guest"),
        displayName: String(r.display_name || "زائر"),
        currentPath: String(r.current_path || "/"),
        currentActivity: String(r.current_activity || "الرئيسية"),
        ip: String(r.ip || "127.0.0.1"),
        country: String(r.country || "Direct / Edge"),
        countryCode: String(r.country_code || "LOCAL"),
        city: String(r.city || ""),
        device: String(r.device || "desktop"),
        browser: String(r.browser || "Chrome"),
        os: String(r.os || "Windows"),
        sessionStartedAt: Number(r.session_started_at) || serverNow,
        lastActive: Number(r.last_active) || serverNow,
        pageCount: Number(r.page_count) || 1,
      }));

      rawVisitors = (visRes.results || []).map((v: any) => ({
        visitorId: String(v.visitor_id),
        fingerprintHash: String(v.fingerprint_hash || ""),
        isAuthenticated: Number(v.is_authenticated) === 1,
        uid: v.uid ? String(v.uid) : null,
        email: v.email ? String(v.email) : null,
        displayName: String(v.display_name || "زائر"),
        country: String(v.country || "Direct / Edge"),
        countryCode: String(v.country_code || "LOCAL"),
        city: String(v.city || ""),
        device: String(v.device || "desktop"),
        browser: String(v.browser || "Chrome"),
        os: String(v.os || "Windows"),
        visitCount: Number(v.visit_count) || 1,
        firstSeenAt: String(v.first_seen_at || ""),
        lastSeenAt: String(v.last_seen_at || ""),
      }));

      rawVisits = (pvRes.results || []).map((pv: any) => ({
        id: String(pv.id),
        visitorId: String(pv.visitor_id),
        sessionId: String(pv.session_id),
        fingerprintHash: String(pv.fingerprint_hash || ""),
        uid: pv.uid ? String(pv.uid) : null,
        email: pv.email ? String(pv.email) : null,
        displayName: String(pv.display_name || "زائر"),
        page: String(pv.page || "/"),
        referrer: String(pv.referrer || "Direct"),
        device: String(pv.device || "desktop"),
        browser: String(pv.browser || "Chrome"),
        os: String(pv.os || "Windows"),
        country: String(pv.country || "Direct / Edge"),
        countryCode: String(pv.country_code || "LOCAL"),
        city: String(pv.city || ""),
        ip: String(pv.ip || "127.0.0.1"),
        createdAtMs: Number(pv.created_at_ms) || serverNow,
        createdAt: String(pv.created_at || new Date(serverNow).toISOString()),
      }));

      rawSessions = (shRes.results || []).map((sh: any) => ({
        sessionId: String(sh.session_id),
        visitorId: String(sh.visitor_id),
        startedAt: String(sh.started_at),
        lastActiveAt: String(sh.last_active_at),
        pageCount: Number(sh.page_count) || 1,
        durationSec: Number(sh.duration_sec) || 0,
      }));
    } catch (err) {
      console.warn("D1 telemetry read fallback to KV/local:", err);
    }
  }

  if (storageMode !== "d1") {
    ensureLocalLoaded();
    if (kv) {
      await loadStateFromKv(kv);
      storageMode = "kv";
    }
    memoryPresence = memoryPresence.filter((p) => p.lastActive >= staleCutoff);
    rawPresence = [...memoryPresence];
    rawVisitors = [...memoryVisitors];
    rawVisits = [...memoryVisits];
    rawSessions = [...memorySessions];
  }

  // Active live sessions sorted newest session first
  const liveSessions: LivePresenceEntry[] = rawPresence
    .filter((p) => p.lastActive >= staleCutoff)
    .sort((a, b) => b.sessionStartedAt - a.sessionStartedAt)
    .map((p) => ({
      ...p,
      online: true,
      elapsedSeconds: Math.max(0, Math.floor((serverNow - p.sessionStartedAt) / 1000)),
      lastSeenSecondsAgo: Math.max(0, Math.floor((serverNow - p.lastActive) / 1000)),
    }));

  // Multi-tab deduplicated online count (exact D:\sentance logic)
  const onlineAuthKeys = new Set<string>();
  const onlineGuestKeys = new Set<string>();
  for (const s of liveSessions) {
    if (s.isAuthenticated && (s.uid || (s.email && s.email !== "Guest"))) {
      onlineAuthKeys.add(s.uid || s.email.toLowerCase());
    } else {
      onlineGuestKeys.add(s.visitorId || s.sessionId);
    }
  }

  const uniqueLiveSummary = {
    uniqueOnlineCount: onlineAuthKeys.size + onlineGuestKeys.size,
    signedInOnlineCount: onlineAuthKeys.size,
    guestOnlineCount: onlineGuestKeys.size,
    openTabsCount: liveSessions.length,
  };

  // Registered Users (from LiveAuthAccount store, sanitized) + authenticated visitors
  const authAccounts = await getLiveAuthUsersAsync();
  const registeredMap = new Map<string, RegisteredAccountSummary>();
  for (const acc of authAccounts) {
    const emailLower = acc.email.toLowerCase().trim();
    registeredMap.set(emailLower, {
      id: acc.id,
      name: acc.name,
      email: acc.email,
      role: checkIsAdminEmail(emailLower) ? "ADMIN" : "CLIENT",
      createdAt: acc.createdAt,
    });
  }
  for (const v of rawVisitors) {
    if (v.isAuthenticated && v.email) {
      const emailLower = v.email.toLowerCase().trim();
      if (!registeredMap.has(emailLower)) {
        registeredMap.set(emailLower, {
          id: v.uid || v.visitorId,
          name: v.displayName,
          email: v.email,
          role: checkIsAdminEmail(emailLower) ? "ADMIN" : "CLIENT",
          createdAt: v.firstSeenAt,
        });
      }
    }
  }
  const registeredUsers = Array.from(registeredMap.values()).sort(
    (a, b) => Date.parse(b.createdAt || "0") - Date.parse(a.createdAt || "0")
  );
  const registeredIdSet = new Set(registeredUsers.map((u) => u.id));
  const registeredEmailSet = new Set(
    registeredUsers.map((u) => u.email.toLowerCase().trim())
  );

  const uniqueGuests = rawVisitors.filter(
    (v) =>
      !v.isAuthenticated &&
      (!v.uid || !registeredIdSet.has(v.uid)) &&
      (!v.email || !registeredEmailSet.has(v.email.toLowerCase().trim()))
  );

  const registeredCount = registeredUsers.length;
  const guestCount = uniqueGuests.length;
  const totalUniqueAllTime = registeredCount + guestCount;
  const conversionPct =
    totalUniqueAllTime > 0
      ? Math.round((registeredCount / totalUniqueAllTime) * 100)
      : 0;

  // Real Page Visits strictly within current & previous period (ZERO fake floors)
  const periodVisits = rawVisits.filter(
    (v) => v.createdAtMs >= startMs && v.createdAtMs <= serverNow
  );
  const prevPeriodVisits = rawVisits.filter(
    (v) => v.createdAtMs >= prevStartMs && v.createdAtMs < startMs
  );
  const todayVisitsList = rawVisits.filter((v) => v.createdAtMs >= todayStartMs);

  const totalVisits = periodVisits.length;
  const uniqueVisitors = new Set(periodVisits.map((v) => v.visitorId)).size;
  const todayVisits = todayVisitsList.length;
  const todayUnique = new Set(todayVisitsList.map((v) => v.visitorId)).size;

  const prevVisits = prevPeriodVisits.length;
  const prevUnique = new Set(prevPeriodVisits.map((v) => v.visitorId)).size;

  const visitChange =
    prevVisits > 0
      ? Math.round(((totalVisits - prevVisits) / prevVisits) * 100)
      : totalVisits > 0
      ? 100
      : 0;
  const uniqueChange =
    prevUnique > 0
      ? Math.round(((uniqueVisitors - prevUnique) / prevUnique) * 100)
      : uniqueVisitors > 0
      ? 100
      : 0;

  // Real Avg Session Duration & Bounce Rate strictly from tracked sessions in window
  const periodSessions = rawSessions.filter((s) => {
    const ms = Date.parse(s.startedAt);
    return !Number.isNaN(ms) && ms >= startMs && ms <= serverNow;
  });

  const avgDuration =
    periodSessions.length > 0
      ? Math.round(
          periodSessions.reduce((sum, s) => sum + (s.durationSec || 0), 0) /
            periodSessions.length
        )
      : 0;

  const singlePageSessions = periodSessions.filter(
    (s) => (s.pageCount || 1) <= 1
  ).length;
  const bounceRate =
    periodSessions.length > 0
      ? Math.round((singlePageSessions / periodSessions.length) * 100)
      : 0;

  // Breakdowns from real period visits
  const pageMap: Record<string, number> = {};
  const refMap: Record<string, number> = {};
  const devMap: Record<string, number> = {};
  const browMap: Record<string, number> = {};
  const countryMap: Record<string, number> = {};

  for (const v of periodVisits) {
    pageMap[v.page] = (pageMap[v.page] || 0) + 1;
    const ref = v.referrer || "Direct";
    refMap[ref] = (refMap[ref] || 0) + 1;
    const dev = v.device || "desktop";
    devMap[dev] = (devMap[dev] || 0) + 1;
    const brow = v.browser || "Other";
    browMap[brow] = (browMap[brow] || 0) + 1;
    const cntry = v.countryCode && v.countryCode !== "LOCAL" ? v.countryCode : v.country;
    countryMap[cntry] = (countryMap[cntry] || 0) + 1;
  }

  const topPages = Object.entries(pageMap)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count);
  const topReferrers = Object.entries(refMap)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count);
  const devices = Object.entries(devMap)
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);
  const browsers = Object.entries(browMap)
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count);
  const countries = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const timeSeries = buildRealTimeSeries(periodVisits, range, serverNow);
  const recentVisits = periodVisits.slice(0, 50);

  return {
    serverNow,
    storageMode,
    liveSessions,
    uniqueLiveSummary,
    uniqueBreakdown: {
      totalUnique: totalUniqueAllTime,
      registeredCount,
      guestCount,
      conversionPct,
    },
    registeredUsers,
    uniqueVisitorsList: rawVisitors.slice(0, 100),
    kpis: {
      totalVisits,
      uniqueVisitors,
      todayVisits,
      todayUnique,
      liveActive: uniqueLiveSummary.uniqueOnlineCount,
      openTabsCount: uniqueLiveSummary.openTabsCount,
      avgDuration,
      bounceRate,
      prevVisits,
      prevUnique,
      visitChange,
      uniqueChange,
    },
    timeSeries,
    topPages,
    topReferrers,
    devices,
    browsers,
    countries,
    recentVisits,
  };
}
