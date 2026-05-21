import type Database from 'better-sqlite3';
import type { DeviceInfo } from '../ami/device-map.js';
import { recordDeviceSnapshotFromAmi } from '../media/device-snapshot.js';
import { countActiveChannels } from './count-channels.js';
import { concurrencyMinuteAtUtc } from './minute-at.js';
import { recordConcurrencySnapshot } from './snapshot.js';

/** AMI 端末一覧から当分の同時通話数を記録（T-CONC-005） */
export function recordConcurrencyFromDevices(
  db: Database.Database,
  devices: readonly DeviceInfo[],
  now: Date = new Date(),
): number {
  const channels = countActiveChannels(devices);
  recordDeviceSnapshotFromAmi(db, devices, now);
  return recordConcurrencySnapshot(db, concurrencyMinuteAtUtc(now), channels);
}
