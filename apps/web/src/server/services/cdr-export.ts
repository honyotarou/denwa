import { renderCdrExportCsv, type CdrExportRow } from '@openpbx/core';
import { listCdrRecords } from '@openpbx/db';
import type Database from 'better-sqlite3';

export function buildCdrExportCsv(db: Database.Database, limit = 5000): string {
  const rows = listCdrRecords(db, limit);
  const mapped: CdrExportRow[] = rows.map((r) => ({
    uniqueid: r.uniqueid,
    startTime: r.startTime ?? '',
    src: r.src ?? '',
    dst: r.dst ?? '',
    billsec: String(r.billsec),
    disposition: r.disposition ?? '',
  }));
  return renderCdrExportCsv(mapped);
}
