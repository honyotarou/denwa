import type Database from 'better-sqlite3';
import { duplicateError, notFoundError } from '../errors.js';

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
  welcomePrompt: string | null;
  menuPrompt: string | null;
  invalidPrompt: string | null;
  goodbyePrompt: string | null;
  maxRetries: number;
  waitSeconds: number;
  options: readonly IvrOptionRow[];
}>;

export type UpsertIvrMenuInput = Readonly<{
  number: string;
  name?: string | null;
  welcomePrompt?: string | null;
  menuPrompt?: string | null;
  invalidPrompt?: string | null;
  goodbyePrompt?: string | null;
  maxRetries?: number;
  waitSeconds?: number;
  options: readonly IvrOptionRow[];
}>;

type MenuRaw = {
  id: number;
  number: string;
  name: string | null;
  welcome_prompt: string | null;
  menu_prompt: string | null;
  invalid_prompt: string | null;
  goodbye_prompt: string | null;
  max_retries: number;
  wait_seconds: number;
};

function options(db: Database.Database, menuId: number): IvrOptionRow[] {
  return (
    db
      .prepare(
        'SELECT digit, action, target, label FROM ivr_options WHERE ivr_menu_id = ? ORDER BY digit',
      )
      .all(menuId) as Array<{ digit: string; action: string; target: string | null; label: string | null }>
  ).map((r) => ({ digit: r.digit, action: r.action, target: r.target, label: r.label }));
}

function mapMenu(db: Database.Database, row: MenuRaw): IvrMenuRow {
  return {
    id: row.id,
    number: row.number,
    name: row.name,
    welcomePrompt: row.welcome_prompt,
    menuPrompt: row.menu_prompt,
    invalidPrompt: row.invalid_prompt,
    goodbyePrompt: row.goodbye_prompt,
    maxRetries: row.max_retries,
    waitSeconds: row.wait_seconds,
    options: options(db, row.id),
  };
}

export function getIvrMenu(db: Database.Database, number: string): IvrMenuRow | null {
  const row = db
    .prepare(
      `SELECT id, number, name, welcome_prompt, menu_prompt, invalid_prompt, goodbye_prompt,
              max_retries, wait_seconds
       FROM ivr_menus WHERE number = ?`,
    )
    .get(number) as MenuRaw | undefined;
  if (!row) return null;
  return mapMenu(db, row);
}

export function createIvrMenu(db: Database.Database, input: UpsertIvrMenuInput): IvrMenuRow {
  if (getIvrMenu(db, input.number)) throw duplicateError(`IVR ${input.number} は既に存在`);
  const info = db
    .prepare(
      `INSERT INTO ivr_menus
         (number, name, welcome_prompt, menu_prompt, invalid_prompt, goodbye_prompt,
          max_retries, wait_seconds, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(
      input.number,
      input.name ?? null,
      input.welcomePrompt ?? null,
      input.menuPrompt ?? null,
      input.invalidPrompt ?? null,
      input.goodbyePrompt ?? null,
      input.maxRetries ?? 3,
      input.waitSeconds ?? 6,
    );
  replaceOptions(db, Number(info.lastInsertRowid), input.options);
  return getIvrMenu(db, input.number)!;
}

export function updateIvrMenu(db: Database.Database, input: UpsertIvrMenuInput): IvrMenuRow {
  const menu = getIvrMenu(db, input.number);
  if (!menu) throw notFoundError(`IVR ${input.number} は存在しません`);
  db.prepare(
    `UPDATE ivr_menus SET
       name = ?, welcome_prompt = ?, menu_prompt = ?, invalid_prompt = ?, goodbye_prompt = ?,
       max_retries = ?, wait_seconds = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    input.name !== undefined ? input.name : menu.name,
    input.welcomePrompt !== undefined ? input.welcomePrompt : menu.welcomePrompt,
    input.menuPrompt !== undefined ? input.menuPrompt : menu.menuPrompt,
    input.invalidPrompt !== undefined ? input.invalidPrompt : menu.invalidPrompt,
    input.goodbyePrompt !== undefined ? input.goodbyePrompt : menu.goodbyePrompt,
    input.maxRetries ?? menu.maxRetries,
    input.waitSeconds ?? menu.waitSeconds,
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
    if (digits.has(o.digit)) throw duplicateError(`IVR digit 重複: ${o.digit}`);
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
