import type Database from 'better-sqlite3';
import { DuplicateError, NotFoundError } from '../errors.js';

export type SipTrunkRow = Readonly<{
  id: number;
  name: string;
  host: string;
  port: number;
}>;

export function upsertSipTrunk(
  db: Database.Database,
  input: { name: string; host: string; port?: number },
): SipTrunkRow {
  db.prepare(
    `INSERT INTO sip_trunks (name, host, port, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(name) DO UPDATE SET host = excluded.host, port = excluded.port, updated_at = datetime('now')`,
  ).run(input.name, input.host, input.port ?? 5060);
  const row = db.prepare('SELECT id, name, host, port FROM sip_trunks WHERE name = ?').get(input.name) as
    | { id: number; name: string; host: string; port: number }
    | undefined;
  if (!row) throw new NotFoundError(`trunk ${input.name}`);
  return row;
}

export function createSipTrunk(
  db: Database.Database,
  input: { name: string; host: string; port?: number },
): SipTrunkRow {
  try {
    const info = db
      .prepare(`INSERT INTO sip_trunks (name, host, port, updated_at) VALUES (?, ?, ?, datetime('now'))`)
      .run(input.name, input.host, input.port ?? 5060);
    return db
      .prepare('SELECT id, name, host, port FROM sip_trunks WHERE id = ?')
      .get(Number(info.lastInsertRowid)) as SipTrunkRow;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE')) throw new DuplicateError(`trunk ${input.name} は既に存在`);
    throw e;
  }
}

export function deleteSipTrunk(db: Database.Database, name: string): boolean {
  return db.prepare('DELETE FROM sip_trunks WHERE name = ?').run(name).changes > 0;
}
