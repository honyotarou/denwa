import type Database from 'better-sqlite3';

/** T-HEALTH-001: SQLite 到達性 */
export function pingDatabase(db: Database.Database): boolean {
  try {
    const row = db.prepare('SELECT 1 AS ok').get() as { ok: number } | undefined;
    return row?.ok === 1;
  } catch {
    return false;
  }
}
