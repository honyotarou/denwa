export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS extensions (
  number        TEXT PRIMARY KEY,
  display_name  TEXT,
  secret        TEXT NOT NULL DEFAULT '',
  note          TEXT,
  webrtc        INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cdr_records (
  uniqueid       TEXT PRIMARY KEY,
  src            TEXT,
  dst            TEXT,
  dcontext       TEXT,
  clid           TEXT,
  channel        TEXT,
  dst_channel    TEXT,
  lastapp        TEXT,
  lastdata       TEXT,
  start_at       TEXT,
  answer_at      TEXT,
  end_at         TEXT,
  duration       INTEGER,
  billsec        INTEGER,
  disposition    TEXT,
  amaflag        TEXT,
  accountcode    TEXT,
  userfield      TEXT,
  imported_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cdr_start ON cdr_records(start_at DESC);
CREATE INDEX IF NOT EXISTS idx_cdr_src ON cdr_records(src);
CREATE INDEX IF NOT EXISTS idx_cdr_dst ON cdr_records(dst);

CREATE TABLE IF NOT EXISTS cdr_ingest_state (
  id           INTEGER PRIMARY KEY CHECK (id = 1),
  source_path  TEXT,
  inode        INTEGER,
  offset       INTEGER NOT NULL DEFAULT 0,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ring_groups (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  number             TEXT NOT NULL UNIQUE,
  name               TEXT,
  strategy           TEXT NOT NULL DEFAULT 'ringall',
  ring_seconds       INTEGER NOT NULL DEFAULT 30,
  fallback_extension TEXT,
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ring_group_members (
  ring_group_id    INTEGER NOT NULL REFERENCES ring_groups(id) ON DELETE CASCADE,
  extension_number TEXT NOT NULL,
  priority         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ring_group_id, extension_number)
);

CREATE TABLE IF NOT EXISTS pickup_groups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pickup_group_members (
  pickup_group_id   INTEGER NOT NULL REFERENCES pickup_groups(id) ON DELETE CASCADE,
  extension_number  TEXT NOT NULL,
  PRIMARY KEY (pickup_group_id, extension_number)
);

CREATE TABLE IF NOT EXISTS phonebook (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  number       TEXT NOT NULL,
  category     TEXT,
  note         TEXT,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_phonebook_number ON phonebook(number);
CREATE INDEX IF NOT EXISTS idx_phonebook_name   ON phonebook(name);

CREATE TABLE IF NOT EXISTS holidays (
  date       TEXT PRIMARY KEY,   -- YYYY-MM-DD
  name       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS time_rules (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  days        TEXT NOT NULL DEFAULT 'mon-fri',
  start_time  TEXT NOT NULL DEFAULT '09:00',
  end_time    TEXT NOT NULL DEFAULT '18:00',
  note        TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ivr_menus (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  number          TEXT NOT NULL UNIQUE,
  name            TEXT,
  welcome_prompt  TEXT,                       -- sounds/<path>
  menu_prompt     TEXT,                       -- sounds/<path>
  invalid_prompt  TEXT,
  goodbye_prompt  TEXT,
  max_retries     INTEGER NOT NULL DEFAULT 3,
  wait_seconds    INTEGER NOT NULL DEFAULT 6,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ivr_options (
  ivr_menu_id  INTEGER NOT NULL REFERENCES ivr_menus(id) ON DELETE CASCADE,
  digit        TEXT NOT NULL,
  action       TEXT NOT NULL,
  target       TEXT,
  label        TEXT,
  PRIMARY KEY (ivr_menu_id, digit)
);

CREATE TABLE IF NOT EXISTS guidances (
  name        TEXT PRIMARY KEY,
  text        TEXT,
  source      TEXT NOT NULL DEFAULT 'upload',
  size        INTEGER,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT NOT NULL UNIQUE,
  display_name    TEXT,
  password_hash   TEXT NOT NULL,         -- scrypt $N$r$p$salt$hash
  role            TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'supervisor' | 'admin'
  totp_secret     TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token         TEXT PRIMARY KEY,
  account_id    INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at    TEXT NOT NULL,
  user_agent    TEXT,
  ip            TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  actor         TEXT,                       -- username
  action        TEXT NOT NULL,              -- 'extension.create', 'login', ...
  target        TEXT,
  details       TEXT,                       -- JSON
  ip            TEXT,
  user_agent    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS login_history (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL,
  success       INTEGER NOT NULL,
  ip            TEXT,
  user_agent    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(username, created_at DESC);

CREATE TABLE IF NOT EXISTS password_policies (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  min_length        INTEGER NOT NULL DEFAULT 8,
  require_lowercase INTEGER NOT NULL DEFAULT 1,
  require_uppercase INTEGER NOT NULL DEFAULT 0,
  require_digit     INTEGER NOT NULL DEFAULT 1,
  require_symbol    INTEGER NOT NULL DEFAULT 0,
  rotation_days     INTEGER NOT NULL DEFAULT 0,
  lockout_threshold INTEGER NOT NULL DEFAULT 5,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO password_policies (id) VALUES (1);

CREATE TABLE IF NOT EXISTS ip_allow_list (
  cidr        TEXT PRIMARY KEY,
  note        TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS billing_rates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  prefix      TEXT NOT NULL UNIQUE,  -- "0X" / "0X0" / "INTL" / "MOBILE"
  label       TEXT,
  per_min     REAL NOT NULL,         -- 円 / 分
  setup_fee   REAL NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS concurrency_snapshots (
  minute_at   TEXT PRIMARY KEY,
  channels    INTEGER NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS network_settings (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  external_ip     TEXT,                 -- 例: Tailscale IP (100.x.x.x) や WAN グローバル IP
  external_signaling_ip TEXT,           -- SIP signaling 用 (省略時 external_ip と同じ)
  local_net       TEXT,                 -- 例: "100.64.0.0/10,192.168.0.0/16" (NAT を通さない LAN 範囲)
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO network_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS patients (
  id           TEXT PRIMARY KEY,
  name         TEXT,
  kana         TEXT,
  birth_date   TEXT,
  phone        TEXT,
  note         TEXT,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (length(id) = 5 AND id GLOB '[0-9][0-9][0-9][0-9][0-9]')
);
CREATE INDEX IF NOT EXISTS idx_patients_kana ON patients(kana);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);

CREATE TABLE IF NOT EXISTS patient_records (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id    TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  extension     TEXT,
  recorded_at   TEXT NOT NULL DEFAULT (datetime('now')),
  kind          TEXT NOT NULL DEFAULT 'note',
  summary       TEXT,
  note          TEXT,
  recommendations_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_patient_records_pid ON patient_records(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_records_date ON patient_records(recorded_at DESC);

CREATE TABLE IF NOT EXISTS version_upgrades (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  scheduled_at TEXT NOT NULL,         -- UTC
  asterisk_image TEXT NOT NULL,        -- 例: ubuntu:24.04 (再ビルド時の base)
  web_image      TEXT,
  note          TEXT,
  applied_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS account_extension_grants (
  account_id        INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  extension_number  TEXT NOT NULL,
  granted_at        TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (account_id, extension_number)
);

CREATE TABLE IF NOT EXISTS click_to_call_tokens (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id      INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  token_hash      TEXT NOT NULL UNIQUE,
  from_extension  TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_click_tokens_account ON click_to_call_tokens(account_id);

CREATE TABLE IF NOT EXISTS sip_trunks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  host            TEXT NOT NULL,
  port            INTEGER NOT NULL DEFAULT 5060,
  username        TEXT,
  secret          TEXT,
  registration    INTEGER NOT NULL DEFAULT 1,
  from_user       TEXT,
  from_domain     TEXT,
  did_inbound     TEXT,                       -- 着信時にこの番号を internal の extension に渡す
  outbound_prefix TEXT,                       -- 例: "0" を外線 prefix にする
  note            TEXT,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
