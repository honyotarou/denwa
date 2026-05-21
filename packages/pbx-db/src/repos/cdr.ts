import type Database from 'better-sqlite3';
import type { CdrListFilter } from '@openpbx/core';
import { normalizeCdrListFilter } from '@openpbx/core';

export type CdrRecordUpsertInput = Readonly<{
  uniqueid: string;
  src?: string | null;
  dst?: string | null;
  dcontext?: string | null;
  clid?: string | null;
  channel?: string | null;
  dstChannel?: string | null;
  lastapp?: string | null;
  lastdata?: string | null;
  startAt?: string | null;
  answerAt?: string | null;
  endAt?: string | null;
  duration?: number;
  billsec?: number;
  disposition?: string | null;
  amaflag?: string | null;
  accountcode?: string | null;
  userfield?: string | null;
}>;

export type CdrListRow = Readonly<{
  uniqueid: string;
  startTime: string | null;
  answerTime: string | null;
  src: string | null;
  dst: string | null;
  channel: string | null;
  disposition: string | null;
  billsec: number;
  duration: number;
}>;

export function upsertCdrRecord(db: Database.Database, input: CdrRecordUpsertInput): void {
  db.prepare(
    `INSERT INTO cdr_records (
       uniqueid, src, dst, dcontext, clid, channel, dst_channel, lastapp, lastdata,
       start_at, answer_at, end_at, duration, billsec, disposition, amaflag,
       accountcode, userfield, imported_at)
     VALUES (
       @uniqueid, @src, @dst, @dcontext, @clid, @channel, @dstChannel, @lastapp, @lastdata,
       @startAt, @answerAt, @endAt, @duration, @billsec, @disposition, @amaflag,
       @accountcode, @userfield, datetime('now'))
     ON CONFLICT(uniqueid) DO UPDATE SET
       src = excluded.src,
       dst = excluded.dst,
       dcontext = excluded.dcontext,
       clid = excluded.clid,
       channel = excluded.channel,
       dst_channel = excluded.dst_channel,
       lastapp = excluded.lastapp,
       lastdata = excluded.lastdata,
       start_at = excluded.start_at,
       answer_at = excluded.answer_at,
       end_at = excluded.end_at,
       duration = excluded.duration,
       billsec = excluded.billsec,
       disposition = excluded.disposition,
       amaflag = excluded.amaflag,
       accountcode = excluded.accountcode,
       userfield = excluded.userfield`,
  ).run({
    uniqueid: input.uniqueid,
    src: input.src ?? null,
    dst: input.dst ?? null,
    dcontext: input.dcontext ?? null,
    clid: input.clid ?? null,
    channel: input.channel ?? null,
    dstChannel: input.dstChannel ?? null,
    lastapp: input.lastapp ?? null,
    lastdata: input.lastdata ?? null,
    startAt: input.startAt ?? null,
    answerAt: input.answerAt ?? null,
    endAt: input.endAt ?? null,
    duration: input.duration ?? 0,
    billsec: input.billsec ?? 0,
    disposition: input.disposition ?? null,
    amaflag: input.amaflag ?? null,
    accountcode: input.accountcode ?? null,
    userfield: input.userfield ?? null,
  });
}

export function listCdrRecordsFiltered(db: Database.Database, filter: CdrListFilter = {}): CdrListRow[] {
  const f = normalizeCdrListFilter(filter);
  const conds: string[] = [];
  const params: unknown[] = [];
  if (f.from) {
    conds.push('start_at >= ?');
    params.push(f.from);
  }
  if (f.to) {
    conds.push('start_at <= ?');
    params.push(f.to);
  }
  if (f.src) {
    conds.push('src LIKE ?');
    params.push(`%${f.src}%`);
  }
  if (f.dst) {
    conds.push('dst LIKE ?');
    params.push(`%${f.dst}%`);
  }
  if (f.disposition) {
    conds.push('disposition = ?');
    params.push(f.disposition);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  return db
    .prepare(
      `SELECT uniqueid, start_at AS startTime, answer_at AS answerTime, src, dst, channel,
              disposition, billsec, duration
       FROM cdr_records ${where}
       ORDER BY COALESCE(start_at, imported_at) DESC LIMIT ?`,
    )
    .all(...params, f.limit) as CdrListRow[];
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

export function reconcileCdrIngestOffset(
  db: Database.Database,
  sourcePath: string,
  inode: number,
  fileSize: number,
): number {
  const state = getCdrIngestState(db);
  if (state.sourcePath !== sourcePath || state.inode !== inode || state.offset < fileSize) {
    return state.offset;
  }
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM cdr_records').get() as { n: number };
  if (n > 0) return state.offset;
  saveCdrIngestOffset(db, sourcePath, inode, 0);
  return 0;
}
