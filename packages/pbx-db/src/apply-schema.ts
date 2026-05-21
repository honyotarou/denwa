import Database from 'better-sqlite3';
import { migrateAccounts } from './migrate-accounts.js';
import { migrateExtensions } from './migrate-extensions.js';
import { SCHEMA_SQL } from './schema-sql.js';

export type ApplySchemaOptions = Readonly<{
  seed?: boolean;
}>;

export function applySchema(db: Database.Database, options: ApplySchemaOptions = {}): void {
  const { seed = false } = options;
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);
  migrateExtensions(db);
  migrateAccounts(db);
  if (seed) {
    seedDevExtensions(db);
  }
}

/** 開発用内線（F-001: ext-dev / secret-100x 禁止）。bootstrap が secret をローテートする。 */
export function seedDevExtensions(db: Database.Database): void {
  const rows = [
    { number: '1001', displayName: 'Reception 1001', note: '受付', webrtc: 0 },
    { number: '1002', displayName: 'Doctor 1002', note: '診察室', webrtc: 1 },
    { number: '1003', displayName: 'Staff 1003', note: 'スタッフ', webrtc: 0 },
  ] as const;
  const ins = db.prepare(
    `INSERT OR IGNORE INTO extensions (number, display_name, secret, note, webrtc, updated_at)
     VALUES (?, ?, '', ?, ?, datetime('now'))`,
  );
  for (const r of rows) {
    ins.run(r.number, r.displayName, r.note, r.webrtc);
  }
}

export function createInMemoryDb(options: ApplySchemaOptions = {}): Database.Database {
  const db = new Database(':memory:');
  applySchema(db, options);
  return db;
}

export function seedExtensions(db: Database.Database): void {
  seedDevExtensions(db);
}
