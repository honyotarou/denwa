import type Database from 'better-sqlite3';
import { insertDeviceSnapshot } from '@openpbx/db';
import type { DeviceInfo } from '../ami/device-map.js';

/** AMI 端末一覧のスナップショットを DB に保存（T-DEV-SNAP-001） */
export function recordDeviceSnapshotFromAmi(
  db: Database.Database,
  devices: readonly DeviceInfo[],
  now: Date = new Date(),
): void {
  const onlineCount = devices.filter((d) => d.reachable === true).length;
  insertDeviceSnapshot(db, {
    snapshotAt: now.toISOString(),
    channelsJson: JSON.stringify(devices),
    onlineCount,
  });
}
