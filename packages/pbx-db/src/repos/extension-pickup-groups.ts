import type Database from 'better-sqlite3';

/** 内線番号 → 所属ピックアップグループ名（PJSIP named_call_group 用） */
export function listPickupGroupNamesByExtension(
  db: Database.Database,
): ReadonlyMap<string, readonly string[]> {
  const rows = db
    .prepare(
      `SELECT pgm.extension_number AS ext, pg.name AS grp
       FROM pickup_group_members pgm
       INNER JOIN pickup_groups pg ON pg.id = pgm.pickup_group_id
       ORDER BY pg.name`,
    )
    .all() as Array<{ ext: string; grp: string }>;
  const map = new Map<string, string[]>();
  for (const { ext, grp } of rows) {
    const cur = map.get(ext) ?? [];
    cur.push(grp);
    map.set(ext, cur);
  }
  return map;
}
