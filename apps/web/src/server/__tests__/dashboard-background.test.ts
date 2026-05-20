import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { applySchema, listConcurrencySnapshots } from '@openpbx/db';
import type { AmiDeviceSession } from '@openpbx/infra/ami/device-session';
import { getDashboardOnlineCount } from '../services/dashboard';
import { runConcurrencyTick } from '../runtime/background-tasks';
import { enrichCdrRowsForUi } from '@openpbx/core';

function mockSession(
  devices: AmiDeviceSession['getDevices'] extends () => infer R ? R : never,
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

describe('T-DASH-002: dashboard service', () => {
  it('Given AMI devices When getDashboardOnlineCount Then excludes unavailable', () => {
    const session = mockSession([
      {
        device: 'PJSIP/1001',
        extension: '1001',
        state: 'not_inuse',
        contact: null,
        reachable: true,
        updatedAt: 't',
      },
      {
        device: 'PJSIP/1002',
        extension: '1002',
        state: 'unavailable',
        contact: null,
        reachable: false,
        updatedAt: 't',
      },
    ]);
    expect(getDashboardOnlineCount(session)).toBe(1);
  });

  it('Given AMI disconnected When getDashboardOnlineCount Then null', () => {
    expect(getDashboardOnlineCount(mockSession([], false))).toBeNull();
  });
});

describe('T-BG-001: concurrency tick', () => {
  it('Given connected session When runConcurrencyTick Then snapshot row', () => {
    const db = new Database(':memory:');
    applySchema(db);
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
    runConcurrencyTick({ db, session, now: new Date('2026-05-20T12:34:56Z') });
    const rows = listConcurrencySnapshots(db, 1);
    expect(rows[0]?.minuteAt).toBe('2026-05-20T12:34:00.000Z');
    expect(rows[0]?.channels).toBe(1);
  });
});

describe('T-CDR-UI-002: enrichCdrRowsForUi', () => {
  it('Given prefix rate When enrich Then cost column', () => {
    const out = enrichCdrRowsForUi(
      [{ uniqueid: 'u1', startTime: null, src: '1', dst: '0311', billsec: 60, disposition: 'ANSWERED' }],
      [{ prefix: '03', perMin: 6, setupFee: 0 }],
    );
    expect(out[0]!.cost).toBe(6);
    expect(out[0]!.ratePrefix).toBe('03');
  });
});
