-- Revive Production Telemetry & Analytics Schema (Cloudflare D1 Edge SQL)

CREATE TABLE IF NOT EXISTS live_presence (
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
);

CREATE TABLE IF NOT EXISTS unique_visitors (
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
);

CREATE TABLE IF NOT EXISTS page_visits (
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
);

CREATE TABLE IF NOT EXISTS session_history (
  session_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  duration_sec INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_revive_presence_active ON live_presence(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_revive_visits_ts ON page_visits(created_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_revive_visits_visitor ON page_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_revive_sessions_started ON session_history(started_at DESC);
