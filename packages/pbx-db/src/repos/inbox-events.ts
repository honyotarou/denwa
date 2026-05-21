import type Database from 'better-sqlite3';

export type InboxEventRow = Readonly<{
  metaName: string;
  uniqueid: string | null;
  kind: string | null;
  extension: string | null;
  callerId: string | null;
  wavName: string | null;
  receivedAt: string | null;
}>;

export function upsertInboxEvent(
  db: Database.Database,
  input: {
    metaName: string;
    uniqueid: string | null;
    kind: string | null;
    extension: string | null;
    callerId: string | null;
    wavName: string | null;
    receivedAt: string | null;
  },
): void {
  db.prepare(
    `INSERT INTO inbox_events (meta_name, uniqueid, kind, extension, caller_id, wav_name, received_at, discovered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(meta_name) DO UPDATE SET
       uniqueid = excluded.uniqueid,
       kind = excluded.kind,
       extension = excluded.extension,
       caller_id = excluded.caller_id,
       wav_name = excluded.wav_name,
       received_at = excluded.received_at,
       discovered_at = datetime('now')`,
  ).run(
    input.metaName,
    input.uniqueid,
    input.kind,
    input.extension,
    input.callerId,
    input.wavName,
    input.receivedAt,
  );
}

export function listInboxEventsForUi(db: Database.Database, limit = 100): InboxEventRow[] {
  return db
    .prepare(
      `SELECT meta_name AS metaName, uniqueid, kind, extension, caller_id AS callerId,
              wav_name AS wavName, received_at AS receivedAt
       FROM inbox_events
       ORDER BY COALESCE(received_at, discovered_at) DESC LIMIT ?`,
    )
    .all(limit) as InboxEventRow[];
}

export function listInboxLinksByUniqueid(
  db: Database.Database,
): Array<{ uniqueid: string; metaName: string }> {
  return db
    .prepare(`SELECT uniqueid, meta_name AS metaName FROM inbox_events WHERE uniqueid IS NOT NULL`)
    .all() as Array<{ uniqueid: string; metaName: string }>;
}
