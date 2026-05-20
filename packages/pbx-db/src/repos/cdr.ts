import type Database from 'better-sqlite3';

export type CdrRecordInput = Readonly<{
  uniqueid: string;
  src?: string;
  dst?: string;
  disposition?: string;
  duration?: number;
  billsec?: number;
}>;

export function upsertCdrRecord(db: Database.Database, input: CdrRecordInput): void {
  db.prepare(
    `INSERT INTO cdr_records (uniqueid, src, dst, disposition, duration, billsec, imported_at)
     VALUES (@uniqueid, @src, @dst, @disposition, @duration, @billsec, datetime('now'))
     ON CONFLICT(uniqueid) DO UPDATE SET
       src = excluded.src,
       dst = excluded.dst,
       disposition = excluded.disposition,
       duration = excluded.duration,
       billsec = excluded.billsec`,
  ).run({
    uniqueid: input.uniqueid,
    src: input.src ?? null,
    dst: input.dst ?? null,
    disposition: input.disposition ?? null,
    duration: input.duration ?? 0,
    billsec: input.billsec ?? 0,
  });
}

export function getCdrRecord(db: Database.Database, uniqueid: string) {
  return db.prepare('SELECT uniqueid, src, dst, disposition, duration FROM cdr_records WHERE uniqueid = ?').get(
    uniqueid,
  ) as { uniqueid: string; src: string | null; dst: string | null; disposition: string | null; duration: number } | undefined;
}

export type IngestState = Readonly<{
  sourcePath: string | null;
  inode: number | null;
  offset: number;
}>;

export function getCdrIngestState(db: Database.Database): IngestState {
  const row = db
    .prepare('SELECT source_path, inode, offset FROM cdr_ingest_state WHERE id = 1')
    .get() as { source_path: string | null; inode: number | null; offset: number } | undefined;
  return {
    sourcePath: row?.source_path ?? null,
    inode: row?.inode ?? null,
    offset: row?.offset ?? 0,
  };
}

export function saveCdrIngestOffset(
  db: Database.Database,
  sourcePath: string,
  inode: number,
  offset: number,
): void {
  db.prepare(
    `INSERT INTO cdr_ingest_state (id, source_path, inode, offset, updated_at)
     VALUES (1, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       source_path = excluded.source_path,
       inode = excluded.inode,
       offset = excluded.offset,
       updated_at = datetime('now')`,
  ).run(sourcePath, inode, offset);
}

/** inode 変化時は offset を 0 にリセット（T-DB-014） */
export function resolveIngestOffset(
  db: Database.Database,
  sourcePath: string,
  inode: number,
  fileSize: number,
): number {
  const state = getCdrIngestState(db);
  let offset = state.offset;
  if (state.inode !== inode) offset = 0;
  if (offset > fileSize) offset = 0;
  saveCdrIngestOffset(db, sourcePath, inode, offset);
  return offset;
}

export function advanceCdrIngestOffset(
  db: Database.Database,
  sourcePath: string,
  inode: number,
  newOffset: number,
): void {
  const state = getCdrIngestState(db);
  if (newOffset < state.offset) {
    throw new Error('cdr ingest offset must be monotonic');
  }
  saveCdrIngestOffset(db, sourcePath, inode, newOffset);
}
