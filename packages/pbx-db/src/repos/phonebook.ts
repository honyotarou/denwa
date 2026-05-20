import type Database from 'better-sqlite3';
import { NotFoundError } from '../errors.js';

export type PhonebookRow = Readonly<{
  id: number;
  name: string;
  number: string;
  category: string | null;
  note: string | null;
  updatedAt: string;
}>;

type Raw = {
  id: number;
  name: string;
  number: string;
  category: string | null;
  note: string | null;
  updated_at: string;
};

const map = (r: Raw): PhonebookRow => ({
  id: r.id,
  name: r.name,
  number: r.number,
  category: r.category,
  note: r.note,
  updatedAt: r.updated_at,
});

export function searchPhonebook(db: Database.Database, q: string): PhonebookRow[] {
  const like = `%${q}%`;
  const rows = db
    .prepare(
      `SELECT id, name, number, category, note, updated_at FROM phonebook
       WHERE name LIKE ? OR number LIKE ? ORDER BY name`,
    )
    .all(like, like) as Raw[];
  return rows.map(map);
}

export function createPhonebookEntry(
  db: Database.Database,
  input: { name: string; number: string; category?: string; note?: string },
): PhonebookRow {
  const info = db
    .prepare(
      `INSERT INTO phonebook (name, number, category, note, updated_at) VALUES (?, ?, ?, ?, datetime('now'))`,
    )
    .run(input.name, input.number, input.category ?? null, input.note ?? null);
  return getPhonebookById(db, Number(info.lastInsertRowid))!;
}

export function getPhonebookById(db: Database.Database, id: number): PhonebookRow | null {
  const row = db
    .prepare('SELECT id, name, number, category, note, updated_at FROM phonebook WHERE id = ?')
    .get(id) as Raw | undefined;
  return row ? map(row) : null;
}

export function deletePhonebookEntry(db: Database.Database, id: number): boolean {
  return db.prepare('DELETE FROM phonebook WHERE id = ?').run(id).changes > 0;
}

export function updatePhonebookEntry(
  db: Database.Database,
  id: number,
  input: { name: string; number: string; category?: string; note?: string },
): PhonebookRow {
  if (!getPhonebookById(db, id)) throw new NotFoundError(`phonebook id=${id}`);
  db.prepare(
    `UPDATE phonebook SET name = ?, number = ?, category = ?, note = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(input.name, input.number, input.category ?? null, input.note ?? null, id);
  return getPhonebookById(db, id)!;
}
