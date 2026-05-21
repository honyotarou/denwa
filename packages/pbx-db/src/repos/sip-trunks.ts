import type Database from 'better-sqlite3';
import { duplicateError, notFoundError } from '../errors.js';

export type UpsertSipTrunkInput = Readonly<{
  name: string;
  host: string;
  port?: number;
  username?: string | null;
  secret?: string | null;
  registration?: boolean;
  fromUser?: string | null;
  fromDomain?: string | null;
  didInbound?: string | null;
  outboundPrefix?: string | null;
  note?: string | null;
}>;

export type SipTrunkRow = Readonly<{
  id: number;
  name: string;
  host: string;
  port: number;
  username: string | null;
  secret: string | null;
  registration: boolean;
  fromUser: string | null;
  fromDomain: string | null;
  didInbound: string | null;
  outboundPrefix: string | null;
  note: string | null;
}>;

type DbRow = {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string | null;
  secret: string | null;
  registration: number;
  from_user: string | null;
  from_domain: string | null;
  did_inbound: string | null;
  outbound_prefix: string | null;
  note: string | null;
};

function rowTo(r: DbRow): SipTrunkRow {
  return {
    id: r.id,
    name: r.name,
    host: r.host,
    port: r.port,
    username: r.username,
    secret: r.secret,
    registration: !!r.registration,
    fromUser: r.from_user,
    fromDomain: r.from_domain,
    didInbound: r.did_inbound,
    outboundPrefix: r.outbound_prefix,
    note: r.note,
  };
}

const UPSERT_SQL = `INSERT INTO sip_trunks
  (name, host, port, username, secret, registration, from_user, from_domain, did_inbound, outbound_prefix, note, updated_at)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
 ON CONFLICT(name) DO UPDATE SET
   host = excluded.host,
   port = excluded.port,
   username = excluded.username,
   secret = excluded.secret,
   registration = excluded.registration,
   from_user = excluded.from_user,
   from_domain = excluded.from_domain,
   did_inbound = excluded.did_inbound,
   outbound_prefix = excluded.outbound_prefix,
   note = excluded.note,
   updated_at = datetime('now')`;

function bindUpsert(input: UpsertSipTrunkInput): unknown[] {
  return [
    input.name,
    input.host,
    input.port ?? 5060,
    input.username ?? null,
    input.secret ?? null,
    input.registration === false ? 0 : 1,
    input.fromUser ?? null,
    input.fromDomain ?? null,
    input.didInbound ?? null,
    input.outboundPrefix ?? null,
    input.note ?? null,
  ];
}

export function upsertSipTrunk(db: Database.Database, input: UpsertSipTrunkInput): SipTrunkRow {
  db.prepare(UPSERT_SQL).run(...bindUpsert(input));
  const row = db.prepare('SELECT * FROM sip_trunks WHERE name = ?').get(input.name) as DbRow | undefined;
  if (!row) throw notFoundError(`trunk ${input.name}`);
  return rowTo(row);
}

export function createSipTrunk(
  db: Database.Database,
  input: Pick<UpsertSipTrunkInput, 'name' | 'host' | 'port'>,
): SipTrunkRow {
  try {
    const info = db
      .prepare(`INSERT INTO sip_trunks (name, host, port, updated_at) VALUES (?, ?, ?, datetime('now'))`)
      .run(input.name, input.host, input.port ?? 5060);
    const row = db.prepare('SELECT * FROM sip_trunks WHERE id = ?').get(Number(info.lastInsertRowid)) as
      | DbRow
      | undefined;
    if (!row) throw notFoundError(`trunk ${input.name}`);
    return rowTo(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE')) throw duplicateError(`trunk ${input.name} は既に存在`);
    throw e;
  }
}

export function deleteSipTrunk(db: Database.Database, name: string): boolean {
  return db.prepare('DELETE FROM sip_trunks WHERE name = ?').run(name).changes > 0;
}

export function listSipTrunks(db: Database.Database): SipTrunkRow[] {
  return (db.prepare('SELECT * FROM sip_trunks ORDER BY name').all() as DbRow[]).map(rowTo);
}
