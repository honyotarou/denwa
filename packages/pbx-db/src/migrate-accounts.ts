import type Database from 'better-sqlite3';

export function migrateAccounts(db: Database.Database): void {
  const cols = db.prepare(`PRAGMA table_info(accounts)`).all() as Array<{ name: string }>;
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('totp_last_counter')) {
    db.exec(`ALTER TABLE accounts ADD COLUMN totp_last_counter INTEGER`);
  }
}
