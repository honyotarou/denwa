import type { CdrParsedRow } from './csv.js';

/** ingest → DB 行（全列） */
export type CdrRecordUpsertInput = Readonly<{
  uniqueid: string;
  src: string | null;
  dst: string | null;
  dcontext: string | null;
  clid: string | null;
  channel: string | null;
  dstChannel: string | null;
  lastapp: string | null;
  lastdata: string | null;
  startAt: string | null;
  answerAt: string | null;
  endAt: string | null;
  duration: number;
  billsec: number;
  disposition: string | null;
  amaflag: string | null;
  accountcode: string | null;
  userfield: string | null;
}>;

export function cdrRecordUpsertFromParsed(row: CdrParsedRow): CdrRecordUpsertInput {
  return {
    uniqueid: row.uniqueid,
    src: row.src || null,
    dst: row.dst || null,
    dcontext: row.dcontext || null,
    clid: row.clid || null,
    channel: row.channel || null,
    dstChannel: row.dstchannel || null,
    lastapp: row.lastapp || null,
    lastdata: row.lastdata || null,
    startAt: row.start,
    answerAt: row.answer,
    endAt: row.end,
    duration: row.durationSec,
    billsec: row.billsecSec,
    disposition: row.disposition || null,
    amaflag: row.amaflag || null,
    accountcode: row.accountcode || null,
    userfield: row.userfield || null,
  };
}
