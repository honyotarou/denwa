import type Database from 'better-sqlite3';

export type DeviceSnapshotRow = Readonly<{
  id: number;
  snapshotAt: string;
  onlineCount: number;
  deviceCount: number;
}>;

const MAX_SNAPSHOTS = 96;

export function insertDeviceSnapshot(
  db: Database.Database,
  input: { snapshotAt: string; channelsJson: string; onlineCount: number },
): void {
  db.prepare(
    `INSERT INTO device_snapshots (snapshot_at, channels_json, online_count)
     VALUES (?, ?, ?)`,
  ).run(input.snapshotAt, input.channelsJson, input.onlineCount);
  const extra = db
    .prepare(`SELECT COUNT(*) AS n FROM device_snapshots`)
    .get() as { n: number };
  if (extra.n > MAX_SNAPSHOTS) {
    db.prepare(
      `DELETE FROM device_snapshots WHERE id NOT IN (
         SELECT id FROM device_snapshots ORDER BY snapshot_at DESC LIMIT ?
       )`,
    ).run(MAX_SNAPSHOTS);
  }
}

export function listDeviceSnapshots(db: Database.Database, limit = 24): DeviceSnapshotRow[] {
  const raw = db
    .prepare(
      `SELECT id, snapshot_at, channels_json, online_count
       FROM device_snapshots ORDER BY snapshot_at DESC LIMIT ?`,
    )
    .all(limit) as Array<{
    id: number;
    snapshot_at: string;
    channels_json: string;
    online_count: number;
  }>;
  return raw.map((r) => {
    let deviceCount = 0;
    try {
      const parsed = JSON.parse(r.channels_json) as unknown;
      deviceCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      deviceCount = 0;
    }
    return {
      id: r.id,
      snapshotAt: r.snapshot_at,
      onlineCount: r.online_count,
      deviceCount,
    };
  });
}
