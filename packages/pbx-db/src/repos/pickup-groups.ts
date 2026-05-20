import type Database from 'better-sqlite3';
import { duplicateError, notFoundError } from '../errors.js';

export type PickupGroupRow = Readonly<{
  id: number;
  name: string;
  members: readonly string[];
  updatedAt: string;
}>;

type Raw = { id: number; name: string; updated_at: string };

function memberList(db: Database.Database, id: number): string[] {
  return (
    db
      .prepare(
        'SELECT extension_number FROM pickup_group_members WHERE pickup_group_id = ? ORDER BY extension_number',
      )
      .all(id) as Array<{ extension_number: string }>
  ).map((r) => r.extension_number);
}

function map(db: Database.Database, r: Raw): PickupGroupRow {
  return { id: r.id, name: r.name, members: memberList(db, r.id), updatedAt: r.updated_at };
}

export function getPickupGroupByName(db: Database.Database, name: string): PickupGroupRow | null {
  const row = db.prepare('SELECT id, name, updated_at FROM pickup_groups WHERE name = ?').get(name) as
    | Raw
    | undefined;
  return row ? map(db, row) : null;
}

export function createPickupGroup(
  db: Database.Database,
  name: string,
  members: readonly string[],
): PickupGroupRow {
  if (getPickupGroupByName(db, name)) throw duplicateError(`ピックアップ ${name} は既に存在`);
  const info = db
    .prepare(`INSERT INTO pickup_groups (name, updated_at) VALUES (?, datetime('now'))`)
    .run(name);
  replaceMembers(db, Number(info.lastInsertRowid), members);
  return getPickupGroupByName(db, name)!;
}

export function updatePickupGroup(
  db: Database.Database,
  name: string,
  members: readonly string[],
): PickupGroupRow {
  const g = getPickupGroupByName(db, name);
  if (!g) throw notFoundError(`ピックアップ ${name} は存在しません`);
  replaceMembers(db, g.id, members);
  return getPickupGroupByName(db, name)!;
}

function replaceMembers(db: Database.Database, groupId: number, memberList: readonly string[]): void {
  const tx = db.transaction((nums: readonly string[]) => {
    db.prepare('DELETE FROM pickup_group_members WHERE pickup_group_id = ?').run(groupId);
    const ins = db.prepare(
      'INSERT INTO pickup_group_members (pickup_group_id, extension_number) VALUES (?, ?)',
    );
    for (const n of nums) ins.run(groupId, n);
  });
  tx(memberList);
}

export function deletePickupGroup(db: Database.Database, name: string): boolean {
  const g = getPickupGroupByName(db, name);
  if (!g) return false;
  return db.prepare('DELETE FROM pickup_groups WHERE id = ?').run(g.id).changes > 0;
}
