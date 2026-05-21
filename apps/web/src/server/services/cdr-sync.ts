import type Database from 'better-sqlite3';
import path from 'node:path';
import { ingestCdrFile } from '@openpbx/infra/cdr/ingest';
import { ensurePeriodicTasks } from '../runtime/periodic-tasks';

/** Master.csv → SQLite（履歴表示の単一正本） */
export async function syncCdrFromMasterCsv(
  db: Database.Database,
  csvPath = process.env.CDR_CSV_PATH ?? path.join(process.cwd(), 'data/asterisk-cdr/Master.csv'),
) {
  ensurePeriodicTasks({ db, cdrCsvPath: csvPath });
  return ingestCdrFile(db, csvPath);
}
