import type Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import { advanceCdrIngestOffset, resolveIngestOffset, upsertCdrRecord } from '@openpbx/db';
import { cdrParsedRowFromCsvLine } from '@openpbx/core';

export type CdrIngestResult = Readonly<{
  ingested: number;
  offset: number;
  skipped: boolean;
  parseErrors: number;
  remainder: string;
}>;

export type IngestCdrChunkInput = Readonly<{
  sourcePath: string;
  inode: number;
  content: string;
  previousRemainder?: string;
}>;

/** バイト列を行に分割し、未完行は remainder に（T-CDR-ING-005） */
export function splitCdrLines(content: string, previousRemainder = ''): {
  completeLines: string[];
  remainder: string;
} {
  const combined = previousRemainder + content;
  const parts = combined.split('\n');
  const remainder = parts.pop() ?? '';
  const completeLines = parts.map((l) => l.replace(/\r$/, '')).filter(Boolean);
  return { completeLines, remainder };
}

export function ingestCdrChunk(
  db: Database.Database,
  input: IngestCdrChunkInput & { startOffset: number },
): CdrIngestResult {
  let parseErrors = 0;
  let ingested = 0;
  const { completeLines, remainder } = splitCdrLines(input.content, input.previousRemainder ?? '');

  const tx = db.transaction((lines: string[]) => {
    for (const line of lines) {
      const row = cdrParsedRowFromCsvLine(line);
      if (!row?.uniqueid) {
        parseErrors++;
        continue;
      }
      upsertCdrRecord(db, {
        uniqueid: row.uniqueid,
        src: row.src,
        dst: row.dst,
        disposition: row.disposition,
        duration: row.durationSec,
        billsec: row.billsecSec,
      });
      ingested++;
    }
  });
  tx(completeLines);

  const newOffset = input.startOffset + Buffer.byteLength(input.content, 'utf8');
  advanceCdrIngestOffset(db, input.sourcePath, input.inode, newOffset);

  return {
    ingested,
    offset: newOffset,
    skipped: false,
    parseErrors,
    remainder,
  };
}

export async function ingestCdrFile(
  db: Database.Database,
  csvPath: string,
  previousRemainder = '',
): Promise<CdrIngestResult> {
  let st;
  try {
    st = await fs.stat(csvPath);
  } catch {
    return { ingested: 0, offset: 0, skipped: true, parseErrors: 0, remainder: previousRemainder };
  }
  if (!st.isFile() || st.size === 0) {
    return { ingested: 0, offset: 0, skipped: true, parseErrors: 0, remainder: previousRemainder };
  }

  const offset = resolveIngestOffset(db, csvPath, st.ino, st.size);
  if (offset >= st.size) {
    return { ingested: 0, offset, skipped: false, parseErrors: 0, remainder: previousRemainder };
  }

  const content = await fs.readFile(csvPath, { encoding: 'utf8' });
  const slice = content.slice(offset);
  return ingestCdrChunk(db, {
    sourcePath: csvPath,
    inode: st.ino,
    content: slice,
    previousRemainder,
    startOffset: offset,
  });
}
