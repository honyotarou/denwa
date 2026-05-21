import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { applySchema, createInMemoryDb } from '../apply-schema.js';
import {
  advanceCdrIngestOffset,
  getCdrIngestState,
  listCdrRecordsFiltered,
  reconcileCdrIngestOffset,
  resolveIngestOffset,
  upsertCdrRecord,
} from '../repos/cdr.js';

function seedTwoRows(db: Database.Database) {
  upsertCdrRecord(db, {
    uniqueid: 'a',
    src: '1001',
    dst: '0312345678',
    startAt: '2026-05-20 10:00:00',
    disposition: 'ANSWERED',
    billsec: 30,
  });
  upsertCdrRecord(db, {
    uniqueid: 'b',
    src: '2001',
    dst: '1002',
    startAt: '2026-05-20 11:00:00',
    disposition: 'BUSY',
    billsec: 0,
  });
}

describe('T-CDR-FILT-DB-001: listCdrRecordsFiltered', () => {
  it('Given rows When filter by src Then matching only', () => {
    const db = new Database(':memory:');
    applySchema(db);
    seedTwoRows(db);
    const rows = listCdrRecordsFiltered(db, { src: '1001', limit: 10 });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.uniqueid).toBe('a');
  });

  it('Given rows When filter by dst/disposition/from/to Then matching', () => {
    const db = new Database(':memory:');
    applySchema(db);
    seedTwoRows(db);
    expect(listCdrRecordsFiltered(db, { dst: '0312' })).toHaveLength(1);
    expect(listCdrRecordsFiltered(db, { disposition: 'BUSY' })[0]!.uniqueid).toBe('b');
    expect(listCdrRecordsFiltered(db, { from: '2026-05-20 11:00:00' })[0]!.uniqueid).toBe('b');
    expect(listCdrRecordsFiltered(db, { to: '2026-05-20 10:00:00' })[0]!.uniqueid).toBe('a');
  });

  it('Given combined filters When list Then AND semantics', () => {
    const db = new Database(':memory:');
    applySchema(db);
    seedTwoRows(db);
    expect(
      listCdrRecordsFiltered(db, { src: '1001', disposition: 'ANSWERED' }),
    ).toHaveLength(1);
    expect(
      listCdrRecordsFiltered(db, { src: '1001', disposition: 'BUSY' }),
    ).toHaveLength(0);
  });
});

describe('T-CDR-INGEST-DB-002: ingest offset branches', () => {
  it('Given offset > fileSize When resolve Then reset to 0', () => {
    const db = createInMemoryDb();
    advanceCdrIngestOffset(db, '/f', 1, 1000);
    expect(resolveIngestOffset(db, '/f', 1, 100)).toBe(0);
  });

  it('Given cdr rows exist at EOF When reconcile Then keep offset', () => {
    const db = createInMemoryDb();
    advanceCdrIngestOffset(db, '/tmp/Master.csv', 1, 500);
    upsertCdrRecord(db, { uniqueid: 'x', src: '1' });
    expect(reconcileCdrIngestOffset(db, '/tmp/Master.csv', 1, 500)).toBe(500);
    expect(getCdrIngestState(db).offset).toBe(500);
  });

  it('Given path mismatch When reconcile Then unchanged offset', () => {
    const db = createInMemoryDb();
    advanceCdrIngestOffset(db, '/a', 1, 500);
    expect(reconcileCdrIngestOffset(db, '/b', 1, 500)).toBe(500);
  });
});
