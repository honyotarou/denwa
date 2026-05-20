import type Database from 'better-sqlite3';
import { DuplicateError, NotFoundError } from '../errors.js';

export type IvrOptionRow = Readonly<{
  digit: string;
  action: string;
  target: string | null;
  label: string | null;
}>;

export type IvrMenuRow = Readonly<{
  id: number;
  number: string;
  name: string | null;
  options: readonly IvrOptionRow[];
}>;

type MenuRaw = { id: number; number: string; name: string | null };

function options(db: Database.Database, menuId: number): IvrOptionRow[] {
  return (
    db
      .prepare(
        'SELECT digit, action, target, label FROM ivr_options WHERE ivr_menu_id = ? ORDER BY digit',
      )
      .all(menuId) as Array<{ digit: string; action: string; target: string | null; label: string | null }>
  ).map((r) => ({ digit: r.digit, action: r.action, target: r.target, label: r.label }));
}

export function getIvrMenu(db: Database.Database, number: string): IvrMenuRow | null {
  const row = db.prepare('SELECT id, number, name FROM ivr_menus WHERE number = ?').get(number) as
    | MenuRaw
    | undefined;
  if (!row) return null;
  return { id: row.id, number: row.number, name: row.name, options: options(db, row.id) };
}

export function createIvrMenu(
  db: Database.Database,
  input: { number: string; name?: string; options: readonly IvrOptionRow[] },
): IvrMenuRow {
  if (getIvrMenu(db, input.number)) throw new DuplicateError(`IVR ${input.number} は既に存在`);
  const info = db
    .prepare(`INSERT INTO ivr_menus (number, name, updated_at) VALUES (?, ?, datetime('now'))`)
    .run(input.number, input.name ?? null);
  replaceOptions(db, Number(info.lastInsertRowid), input.options);
  return getIvrMenu(db, input.number)!;
}

export function updateIvrMenu(
  db: Database.Database,
  input: { number: string; name?: string; options: readonly IvrOptionRow[] },
): IvrMenuRow {
  const menu = getIvrMenu(db, input.number);
  if (!menu) throw new NotFoundError(`IVR ${input.number} は存在しません`);
  db.prepare(`UPDATE ivr_menus SET name = ?, updated_at = datetime('now') WHERE id = ?`).run(
    input.name ?? menu.name,
    menu.id,
  );
  replaceOptions(db, menu.id, input.options);
  return getIvrMenu(db, input.number)!;
}

export function deleteIvrMenu(db: Database.Database, number: string): boolean {
  const menu = getIvrMenu(db, number);
  if (!menu) return false;
  return db.prepare('DELETE FROM ivr_menus WHERE id = ?').run(menu.id).changes > 0;
}

function replaceOptions(db: Database.Database, menuId: number, opts: readonly IvrOptionRow[]): void {
  const digits = new Set<string>();
  for (const o of opts) {
    if (digits.has(o.digit)) throw new DuplicateError(`IVR digit 重複: ${o.digit}`);
    digits.add(o.digit);
  }
  const tx = db.transaction((rows: readonly IvrOptionRow[]) => {
    db.prepare('DELETE FROM ivr_options WHERE ivr_menu_id = ?').run(menuId);
    const ins = db.prepare(
      'INSERT INTO ivr_options (ivr_menu_id, digit, action, target, label) VALUES (?, ?, ?, ?, ?)',
    );
    for (const o of rows) ins.run(menuId, o.digit, o.action, o.target, o.label);
  });
  tx(opts);
}
