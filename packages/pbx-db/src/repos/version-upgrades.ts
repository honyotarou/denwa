import type Database from 'better-sqlite3';

export type VersionUpgradeRow = Readonly<{
  id: number;
  scheduledAt: string;
  asteriskImage: string;
  note: string | null;
}>;

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
    .prepare('SELECT id, scheduled_at, asterisk_image, note FROM version_upgrades WHERE id = ?')
    .get(id) as { id: number; scheduled_at: string; asterisk_image: string; note: string | null } | undefined;
  if (!row) return null;
  return { id: row.id, scheduledAt: row.scheduled_at, asteriskImage: row.asterisk_image, note: row.note };
}

export function listVersionUpgrades(db: Database.Database): VersionUpgradeRow[] {
  return (
    db
      .prepare('SELECT id, scheduled_at, asterisk_image, note FROM version_upgrades ORDER BY scheduled_at')
      .all() as Array<{ id: number; scheduled_at: string; asterisk_image: string; note: string | null }>
  ).map((r) => ({
    id: r.id,
    scheduledAt: r.scheduled_at,
    asteriskImage: r.asterisk_image,
    note: r.note,
  }));
}

export function deleteVersionUpgrade(db: Database.Database, id: number): boolean {
  return db.prepare('DELETE FROM version_upgrades WHERE id = ?').run(id).changes > 0;
}
