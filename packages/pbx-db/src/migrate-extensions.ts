import type Database from 'better-sqlite3';

/** legacy DB 向け冪等マイグレーション（OpenPBX db.ts 同等） */
export function migrateExtensions(db: Database.Database): void {
  const cols = db.prepare(`PRAGMA table_info(extensions)`).all() as Array<{ name: string }>;
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('secret')) {
    db.exec(`ALTER TABLE extensions ADD COLUMN secret TEXT NOT NULL DEFAULT ''`);
  }
  if (!names.has('updated_at')) {
    db.exec(`ALTER TABLE extensions ADD COLUMN updated_at TEXT`);
    db.exec(`UPDATE extensions SET updated_at = datetime('now') WHERE updated_at IS NULL`);
  }
  if (!names.has('webrtc')) {
    db.exec(`ALTER TABLE extensions ADD COLUMN webrtc INTEGER NOT NULL DEFAULT 0`);
  }
}
