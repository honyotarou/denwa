import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { applySchema, upsertCdrRecord, upsertBillingRate } from '@openpbx/db';
import type { AmiDeviceSession } from '@openpbx/infra/ami/device-session';
import {
  countInboxSummaryFromDir,
  getDeviceOnlineSummary,
  getPjsipExtensionsMtime,
  listExtensionsForHome,
} from '../services/home-summary';
import { getConcurrencyUiData } from '../services/concurrency-ui';
import { getBillingDetailForUi } from '../services/billing-detail';
import { cdrFilterFromSearchParams, listCdrForUiFiltered } from '../services/cdr-list';

const tmpDirs: string[] = [];

function mockSession(
  devices: ReturnType<AmiDeviceSession['getDevices']>,
  connected = true,
): AmiDeviceSession {
  return {
    start: () => {},
    destroy: () => {},
    isConnected: () => connected,
    getDevices: () => devices,
    onChange: () => () => {},
  };
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

describe('T-HOME-SVC-001: home-summary service', () => {
  it('Given connected AMI When getDeviceOnlineSummary Then X/Y', () => {
    const summary = getDeviceOnlineSummary(
      mockSession([
        {
          device: 'PJSIP/1001',
          extension: '1001',
          state: 'inuse',
          contact: null,
          reachable: true,
          updatedAt: 't',
        },
        {
          device: 'SIP/foo',
          extension: null,
          state: 'unknown',
          contact: null,
          reachable: null,
          updatedAt: 't',
        },
      ]),
    );
    expect(summary.amiReady).toBe(true);
    expect(summary.online).toBe(1);
    expect(summary.total).toBe(1);
  });

  it('Given disconnected AMI When getDeviceOnlineSummary Then nulls', () => {
    expect(getDeviceOnlineSummary(mockSession([], false))).toEqual({
      online: null,
      total: null,
      amiReady: false,
    });
  });

  it('Given extensions.conf When getPjsipExtensionsMtime Then ISO string', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pjsip-mtime-'));
    tmpDirs.push(dir);
    await fs.writeFile(path.join(dir, 'extensions.conf'), '[1001]\n');
    const mtime = await getPjsipExtensionsMtime(dir);
    expect(mtime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('Given missing conf When getPjsipExtensionsMtime Then null', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pjsip-empty-'));
    tmpDirs.push(dir);
    expect(await getPjsipExtensionsMtime(dir)).toBeNull();
  });

  it('Given db When listExtensionsForHome Then rows', () => {
    const db = new Database(':memory:');
    applySchema(db, { seed: true });
    expect(listExtensionsForHome(db).length).toBeGreaterThanOrEqual(3);
  });

  it('Given inbox dir When countInboxSummaryFromDir Then shape', async () => {
    const summary = await countInboxSummaryFromDir();
    expect(summary).toHaveProperty('wav');
    expect(summary).toHaveProperty('meta');
  });
});

describe('T-CONC-SVC-001: concurrency-ui service', () => {
  it('Given snapshots and AMI When getConcurrencyUiData Then bars + current', () => {
    const db = new Database(':memory:');
    applySchema(db);
    db.prepare(
      `INSERT INTO concurrency_snapshots (minute_at, channels) VALUES (?, ?), (?, ?)`,
    ).run('2026-05-20T10:00:00.000Z', 2, '2026-05-20T10:01:00.000Z', 4);
    const session = mockSession([
      {
        device: 'PJSIP/1001',
        extension: '1001',
        state: 'inuse',
        contact: null,
        reachable: true,
        updatedAt: 't',
      },
    ]);
    const data = getConcurrencyUiData(db, session, 10);
    expect(data.currentChannels).toBe(1);
    expect(data.bars.length).toBe(2);
    expect(data.maxChannels).toBeGreaterThanOrEqual(4);
    expect(data.bars[0]!.heightPct).toBeGreaterThanOrEqual(2);
  });

  it('Given disconnected AMI When getConcurrencyUiData Then current null', () => {
    const db = new Database(':memory:');
    applySchema(db);
    const data = getConcurrencyUiData(db, mockSession([], false));
    expect(data.currentChannels).toBeNull();
    expect(data.bars).toEqual([]);
    expect(data.maxChannels).toBe(1);
  });
});

describe('T-BILL-SVC-001: billing-detail service', () => {
  it('Given cdr + rates When getBillingDetailForUi Then rows and total', () => {
    const db = new Database(':memory:');
    applySchema(db);
    upsertBillingRate(db, { prefix: '03', perMin: 6, setupFee: 0 });
    upsertCdrRecord(db, {
      uniqueid: 'u1',
      dst: '031234',
      billsec: 60,
      startAt: '2026-05-20 12:00:00',
    });
    const { rows, total } = getBillingDetailForUi(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.cost).toBeGreaterThan(0);
    expect(total).toBe(rows[0]!.cost);
  });
});

describe('T-CDR-SVC-001: cdr-list service', () => {
  it('Given search params When cdrFilterFromSearchParams Then limit 300', () => {
    const f = cdrFilterFromSearchParams({ src: '1001', disposition: 'ANSWERED' });
    expect(f.limit).toBe(300);
    expect(f.src).toBe('1001');
  });

  it('Given db rows When listCdrForUiFiltered Then enriched + raw', async () => {
    const db = new Database(':memory:');
    applySchema(db);
    upsertCdrRecord(db, {
      uniqueid: 'z1',
      src: '1001',
      dst: '1002',
      startAt: '2026-05-20 09:00:00',
      disposition: 'ANSWERED',
      billsec: 10,
    });
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'cdr-list-'));
    tmpDirs.push(base);
    const csv = path.join(base, 'Master.csv');
    await fs.writeFile(csv, '');
    const prevCsv = process.env.CDR_CSV_PATH;
    process.env.CDR_CSV_PATH = csv;
    let rows: Awaited<ReturnType<typeof listCdrForUiFiltered>>['rows'];
    let raw: Awaited<ReturnType<typeof listCdrForUiFiltered>>['raw'];
    try {
      ({ rows, raw } = await listCdrForUiFiltered(db, { limit: 5 }));
    } finally {
      if (prevCsv === undefined) delete process.env.CDR_CSV_PATH;
      else process.env.CDR_CSV_PATH = prevCsv;
    }
    expect(raw).toHaveLength(1);
    expect(rows[0]!.uniqueid).toBe('z1');
    expect(rows[0]!.src).toBe('1001');
  });
});
