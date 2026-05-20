import type Database from 'better-sqlite3';

export type VersionUpgradeRow = Readonly<{
  id: number;
  scheduledAt: string;
  asteriskImage: string;
  note: string | null;
  appliedAt: string | null;
}>;

type Raw = {
  id: number;
  scheduled_at: string;
  asterisk_image: string;
  note: string | null;
  applied_at: string | null;
};

function map(r: Raw): VersionUpgradeRow {
  return {
    id: r.id,
    scheduledAt: r.scheduled_at,
    asteriskImage: r.asterisk_image,
    note: r.note,
    appliedAt: r.applied_at,
  };
}

export function scheduleVersionUpgrade(
  db: Database.Database,
  input: { scheduledAt: string; asteriskImage: string; webImage?: string; note?: string },
): VersionUpgradeRow {
  const info = db
    .prepare(
      `INSERT INTO version_upgrades (scheduled_at, asterisk_image, web_image, note, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
    )
    .run(input.scheduledAt, input.asteriskImage, input.webImage ?? null, input.note ?? null);
  return getVersionUpgrade(db, Number(info.lastInsertRowid))!;
}

export function getVersionUpgrade(db: Database.Database, id: number): VersionUpgradeRow | null {
  const row = db
    .prepare(
      'SELECT id, scheduled_at, asterisk_image, note, applied_at FROM version_upgrades WHERE id = ?',
    )
    .get(id) as Raw | undefined;
  return row ? map(row) : null;
}

export function listVersionUpgrades(db: Database.Database): VersionUpgradeRow[] {
  return (
    db
      .prepare(
        'SELECT id, scheduled_at, asterisk_image, note, applied_at FROM version_upgrades ORDER BY scheduled_at',
      )
      .all() as Raw[]
  ).map(map);
}

export function listDueUnappliedUpgrades(db: Database.Database, nowIso: string): VersionUpgradeRow[] {
  return (
    db
      .prepare(
        `SELECT id, scheduled_at, asterisk_image, note, applied_at
         FROM version_upgrades
         WHERE applied_at IS NULL AND scheduled_at <= ?
         ORDER BY scheduled_at`,
      )
      .all(nowIso) as Raw[]
  ).map(map);
}

export function markUpgradeApplied(db: Database.Database, id: number): boolean {
  return (
    db
      .prepare(
        `UPDATE version_upgrades SET applied_at = datetime('now') WHERE id = ? AND applied_at IS NULL`,
      )
      .run(id).changes > 0
  );
}

export function deleteVersionUpgrade(db: Database.Database, id: number): boolean {
  return db.prepare('DELETE FROM version_upgrades WHERE id = ?').run(id).changes > 0;
}
