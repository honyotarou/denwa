import type Database from 'better-sqlite3';
import { duplicateError, notFoundError } from '../errors.js';

export function upsertHoliday(db: Database.Database, date: string, name: string): void {
  db.prepare(
    `INSERT INTO holidays (date, name, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(date) DO UPDATE SET name = excluded.name, updated_at = datetime('now')`,
  ).run(date, name);
}

export function deleteHoliday(db: Database.Database, date: string): boolean {
  return db.prepare('DELETE FROM holidays WHERE date = ?').run(date).changes > 0;
}

export function listHolidays(db: Database.Database): Array<{ date: string; name: string }> {
  return db.prepare('SELECT date, name FROM holidays ORDER BY date').all() as Array<{
    date: string;
    name: string;
  }>;
}

export type TimeRuleRow = Readonly<{
  id: number;
  name: string;
  days: string;
  startTime: string;
  endTime: string;
  note: string | null;
}>;

export function createTimeRule(
  db: Database.Database,
  input: { name: string; days?: string; startTime?: string; endTime?: string; note?: string },
): TimeRuleRow {
  try {
    const info = db
      .prepare(
        `INSERT INTO time_rules (name, days, start_time, end_time, note, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      )
      .run(
        input.name,
        input.days ?? 'mon-fri',
        input.startTime ?? '09:00',
        input.endTime ?? '18:00',
        input.note ?? null,
      );
    return getTimeRule(db, Number(info.lastInsertRowid))!;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE')) throw duplicateError(`time_rule ${input.name} は既に存在`);
    throw e;
  }
}

export function getTimeRule(db: Database.Database, id: number): TimeRuleRow | null {
  const row = db
    .prepare('SELECT id, name, days, start_time, end_time, note FROM time_rules WHERE id = ?')
    .get(id) as
    | {
        id: number;
        name: string;
        days: string;
        start_time: string;
        end_time: string;
        note: string | null;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    days: row.days,
    startTime: row.start_time,
    endTime: row.end_time,
    note: row.note,
  };
}

export function deleteTimeRule(db: Database.Database, id: number): boolean {
  return db.prepare('DELETE FROM time_rules WHERE id = ?').run(id).changes > 0;
}

export function updateTimeRule(
  db: Database.Database,
  id: number,
  input: { name: string; days: string; startTime: string; endTime: string },
): TimeRuleRow {
  if (!getTimeRule(db, id)) throw notFoundError(`time_rule id=${id}`);
  db.prepare(
    `UPDATE time_rules SET name = ?, days = ?, start_time = ?, end_time = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(input.name, input.days, input.startTime, input.endTime, id);
  return getTimeRule(db, id)!;
}
