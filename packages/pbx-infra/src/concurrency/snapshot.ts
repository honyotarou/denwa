import type Database from 'better-sqlite3';
import { upsertConcurrencySnapshot, getConcurrencySnapshot } from '@openpbx/db';

/** T-CONC-001 / T-CONC-002 */
export function recordConcurrencySnapshot(
  db: Database.Database,
  minuteAt: string,
  channels: number,
): number {
  upsertConcurrencySnapshot(db, minuteAt, channels);
  return getConcurrencySnapshot(db, minuteAt) ?? 0;
}
