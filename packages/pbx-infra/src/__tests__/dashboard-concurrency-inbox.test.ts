import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { applySchema } from '@openpbx/db';
import { countOnlineDevices } from '../concurrency/online-count.js';
import { concurrencyMinuteAtUtc } from '../concurrency/minute-at.js';
import { recordConcurrencyFromDevices } from '../concurrency/record-from-devices.js';
import type { DeviceInfo } from '../ami/device-map.js';

describe('dashboard + concurrency infra', () => {
  it('T-DASH-001: countOnlineDevices excludes unavailable', () => {
    const devices = [
      { state: 'not_inuse' as const },
      { state: 'unavailable' as const },
      { state: 'inuse' as const },
    ];
    expect(countOnlineDevices(devices)).toBe(2);
  });

  it('T-CONC-005: recordConcurrencyFromDevices upserts minute bucket', () => {
    const db = new Database(':memory:');
    applySchema(db);
    const now = new Date('2026-05-20T10:15:42.000Z');
    const devices: DeviceInfo[] = [
      {
        device: 'PJSIP/1001',
        extension: '1001',
        state: 'inuse',
        contact: null,
        reachable: true,
        updatedAt: now.toISOString(),
      },
      {
        device: 'PJSIP/1002',
        extension: '1002',
        state: 'not_inuse',
        contact: null,
        reachable: true,
        updatedAt: now.toISOString(),
      },
    ];
    const channels = recordConcurrencyFromDevices(db, devices, now);
    expect(channels).toBe(1);
    expect(concurrencyMinuteAtUtc(now)).toBe('2026-05-20T10:15:00.000Z');
    const row = db
      .prepare('SELECT channels FROM concurrency_snapshots WHERE minute_at = ?')
      .get('2026-05-20T10:15:00.000Z') as { channels: number };
    expect(row.channels).toBe(1);
  });
});
