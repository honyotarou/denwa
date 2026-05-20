/** Asterisk cdr_csv (Master.csv) 1 行のパース — Web の ingest と同じ契約 */

export const CDR_FIELD_NAMES = [
  'accountcode',
  'src',
  'dst',
  'dcontext',
  'clid',
  'channel',
  'dstchannel',
  'lastapp',
  'lastdata',
  'start',
  'answer',
  'end',
  'duration',
  'billsec',
  'disposition',
  'amaflag',
  'userfield',
  'uniqueid',
] as const;

export type CdrFieldName = (typeof CDR_FIELD_NAMES)[number];
export type CdrCsvRow = Readonly<Record<CdrFieldName, string>>;

/** ingest 向け: 秒数は数値、空の日時は null（legacy `cdr.ts` ingest と同型） */
export type CdrParsedRow = Readonly<
  Omit<CdrCsvRow, 'start' | 'answer' | 'end' | 'duration' | 'billsec'> & {
    start: string | null;
    answer: string | null;
    end: string | null;
    durationSec: number;
    billsecSec: number;
  }
>;

export function parseCdrCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuote = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function cdrRowFromCsvLine(line: string): CdrCsvRow | null {
  const cols = parseCdrCsvLine(line);
  if (cols.length < CDR_FIELD_NAMES.length) return null;
  const row = {} as Record<CdrFieldName, string>;
  for (let i = 0; i < CDR_FIELD_NAMES.length; i++) {
    row[CDR_FIELD_NAMES[i]] = cols[i] ?? '';
  }
  return row;
}

function cdrTimestampOrNull(value: string): string | null {
  return value.trim() === '' ? null : value;
}

function cdrSecondsOrZero(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function cdrParsedRowFromCsvLine(line: string): CdrParsedRow | null {
  const row = cdrRowFromCsvLine(line);
  if (!row) return null;
  return {
    accountcode: row.accountcode,
    src: row.src,
    dst: row.dst,
    dcontext: row.dcontext,
    clid: row.clid,
    channel: row.channel,
    dstchannel: row.dstchannel,
    lastapp: row.lastapp,
    lastdata: row.lastdata,
    start: cdrTimestampOrNull(row.start),
    answer: cdrTimestampOrNull(row.answer),
    end: cdrTimestampOrNull(row.end),
    disposition: row.disposition,
    amaflag: row.amaflag,
    userfield: row.userfield,
    uniqueid: row.uniqueid,
    durationSec: cdrSecondsOrZero(row.duration),
    billsecSec: cdrSecondsOrZero(row.billsec),
  };
}
