import type Database from 'better-sqlite3';

/** §8.2 + legacy 拡張テーブル */
export const EXPECTED_TABLES = [
  'extensions',
  'cdr_records',
  'cdr_ingest_state',
  'ring_groups',
  'ring_group_members',
  'pickup_groups',
  'pickup_group_members',
  'phonebook',
  'holidays',
  'time_rules',
  'ivr_menus',
  'ivr_options',
  'guidances',
  'accounts',
  'sessions',
  'audit_log',
  'login_history',
  'password_policies',
  'ip_allow_list',
  'billing_rates',
  'concurrency_snapshots',
  'network_settings',
  'patients',
  'patient_records',
  'version_upgrades',
  'sip_trunks',
  'account_extension_grants',
  'click_to_call_tokens',
  'recording_files',
  'inbox_events',
  'device_snapshots',
] as const;

export const REQUIRED_INDEXES = [
  'idx_cdr_start',
  'idx_cdr_src',
  'idx_cdr_dst',
  'idx_phonebook_number',
  'idx_phonebook_name',
  'idx_audit_created',
  'idx_login_history_user',
  'idx_patients_kana',
  'idx_patients_name',
  'idx_patient_records_pid',
  'idx_patient_records_date',
  'idx_click_tokens_account',
  'idx_recording_uniqueid',
  'idx_inbox_uniqueid',
  'idx_device_snap_at',
] as const;

export const REQUIRED_FK_TABLES = [
  'ring_group_members',
  'pickup_group_members',
  'ivr_options',
  'sessions',
  'patient_records',
] as const;

export function listUserTables(db: Database.Database): string[] {
  return (
    db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
      )
      .all() as Array<{ name: string }>
  ).map((r) => r.name);
}

export function listIndexes(db: Database.Database): string[] {
  return (
    db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
      .all() as Array<{ name: string }>
  ).map((r) => r.name);
}

export function foreignKeysOnDeleteCascade(db: Database.Database, table: string): boolean {
  const rows = db.prepare(`PRAGMA foreign_key_list(${table})`).all() as Array<{
    on_delete: string;
  }>;
  return rows.length > 0 && rows.every((r) => r.on_delete === 'CASCADE');
}

export type SchemaColumn = Readonly<{ name: string; type: string; notnull: number; pk: number }>;

export type SchemaTableSnapshot = Readonly<{
  name: string;
  columns: readonly SchemaColumn[];
}>;

export type NormalizedSchemaSnapshot = Readonly<{
  tables: readonly SchemaTableSnapshot[];
  indexes: readonly string[];
}>;

export function captureSchemaSnapshot(db: Database.Database): NormalizedSchemaSnapshot {
  const tables = listUserTables(db).map((name) => {
    const columns = (
      db.prepare(`PRAGMA table_info(${name})`).all() as Array<{
        name: string;
        type: string;
        notnull: number;
        pk: number;
      }>
    ).map((c) => ({
      name: c.name,
      type: c.type,
      notnull: c.notnull,
      pk: c.pk,
    }));
    return { name, columns };
  });
  return { tables, indexes: listIndexes(db) };
}

export function assertSchemaContract(db: Database.Database): string[] {
  const errors: string[] = [];
  const tables = new Set(listUserTables(db));
  for (const t of EXPECTED_TABLES) {
    if (!tables.has(t)) errors.push(`missing table: ${t}`);
  }
  const indexes = new Set(listIndexes(db));
  for (const idx of REQUIRED_INDEXES) {
    if (!indexes.has(idx)) errors.push(`missing index: ${idx}`);
  }
  for (const t of REQUIRED_FK_TABLES) {
    if (!foreignKeysOnDeleteCascade(db, t)) errors.push(`FK CASCADE missing on: ${t}`);
  }
  return errors;
}
