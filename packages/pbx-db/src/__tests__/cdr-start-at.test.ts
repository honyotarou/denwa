import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { applySchema } from '../apply-schema.js';
import { upsertCdrRecord } from '../repos/cdr.js';

describe('T-CDR-START-001: cdr start_at on ingest', () => {
  it('Given startAt When upsert Then listable by start_at', () => {
    const db = new Database(':memory:');
    applySchema(db);
    upsertCdrRecord(db, {
      uniqueid: '1779308728.0',
      src: '1001',
      dst: '1002',
      disposition: 'NO ANSWER',
      billsec: 0,
      startAt: '2026-05-20 20:25:28',
    });
    const row = db
      .prepare('SELECT start_at, src, dst FROM cdr_records WHERE uniqueid = ?')
      .get('1779308728.0') as { start_at: string; src: string; dst: string };
    expect(row.start_at).toBe('2026-05-20 20:25:28');
    expect(row.src).toBe('1001');
  });
});
