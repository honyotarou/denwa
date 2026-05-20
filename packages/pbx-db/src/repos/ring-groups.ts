import type Database from 'better-sqlite3';
import { DuplicateError, NotFoundError } from '../errors.js';

export type RingGroupRow = Readonly<{
  id: number;
  number: string;
  name: string | null;
  strategy: string;
  ringSeconds: number;
  fallbackExtension: string | null;
  members: readonly string[];
  updatedAt: string;
}>;

type GroupRaw = {
  id: number;
  number: string;
  name: string | null;
  strategy: string;
  ring_seconds: number;
  fallback_extension: string | null;
  updated_at: string;
};

function members(db: Database.Database, id: number): string[] {
  return (
    db
      .prepare(
        'SELECT extension_number FROM ring_group_members WHERE ring_group_id = ? ORDER BY priority, extension_number',
      )
      .all(id) as Array<{ extension_number: string }>
  ).map((r) => r.extension_number);
}

function mapGroup(db: Database.Database, r: GroupRaw): RingGroupRow {
  return {
    id: r.id,
    number: r.number,
    name: r.name,
    strategy: r.strategy,
    ringSeconds: r.ring_seconds,
    fallbackExtension: r.fallback_extension,
    members: members(db, r.id),
    updatedAt: r.updated_at,
  };
}

export function getRingGroup(db: Database.Database, number: string): RingGroupRow | null {
  const row = db
    .prepare(
      'SELECT id, number, name, strategy, ring_seconds, fallback_extension, updated_at FROM ring_groups WHERE number = ?',
    )
    .get(number) as GroupRaw | undefined;
  return row ? mapGroup(db, row) : null;
}

export type UpsertRingGroupInput = Readonly<{
  number: string;
  name?: string | null;
  strategy?: string;
  ringSeconds?: number;
  fallbackExtension?: string | null;
  members?: readonly string[];
}>;

export function createRingGroup(db: Database.Database, input: UpsertRingGroupInput): RingGroupRow {
  if (getRingGroup(db, input.number)) throw new DuplicateError(`着信グループ ${input.number} は既に存在`);
  const info = db
    .prepare(
      `INSERT INTO ring_groups (number, name, strategy, ring_seconds, fallback_extension, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(
      input.number,
      input.name ?? null,
      input.strategy ?? 'ringall',
      input.ringSeconds ?? 30,
      input.fallbackExtension ?? null,
    );
  replaceMembers(db, Number(info.lastInsertRowid), input.members ?? []);
  return getRingGroup(db, input.number)!;
}

export function updateRingGroup(db: Database.Database, input: UpsertRingGroupInput): RingGroupRow {
  const existing = getRingGroup(db, input.number);
  if (!existing) throw new NotFoundError(`着信グループ ${input.number} は存在しません`);
  db.prepare(
    `UPDATE ring_groups SET name = ?, strategy = ?, ring_seconds = ?, fallback_extension = ?, updated_at = datetime('now') WHERE number = ?`,
  ).run(
    input.name ?? null,
    input.strategy ?? existing.strategy,
    input.ringSeconds ?? existing.ringSeconds,
    input.fallbackExtension ?? null,
    input.number,
  );
  replaceMembers(db, existing.id, input.members ?? existing.members);
  return getRingGroup(db, input.number)!;
}

function replaceMembers(db: Database.Database, groupId: number, memberList: readonly string[]): void {
  const tx = db.transaction((nums: readonly string[]) => {
    db.prepare('DELETE FROM ring_group_members WHERE ring_group_id = ?').run(groupId);
    const ins = db.prepare(
      'INSERT INTO ring_group_members (ring_group_id, extension_number, priority) VALUES (?, ?, ?)',
    );
    nums.forEach((n, i) => ins.run(groupId, n, i));
  });
  tx(memberList);
}

export function deleteRingGroup(db: Database.Database, number: string): boolean {
  const g = getRingGroup(db, number);
  if (!g) return false;
  return db.prepare('DELETE FROM ring_groups WHERE id = ?').run(g.id).changes > 0;
}
