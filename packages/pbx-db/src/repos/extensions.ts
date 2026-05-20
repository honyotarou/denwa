import type Database from 'better-sqlite3';
import { constraintError, duplicateError, notFoundError } from '../errors.js';

export type ExtensionRow = Readonly<{
  number: string;
  displayName: string | null;
  secret: string;
  note: string | null;
  webrtc: boolean;
  updatedAt: string;
}>;

type Raw = {
  number: string;
  display_name: string | null;
  secret: string;
  note: string | null;
  webrtc: number;
  updated_at: string;
};

function map(r: Raw): ExtensionRow {
  return {
    number: r.number,
    displayName: r.display_name,
    secret: r.secret,
    note: r.note,
    webrtc: !!r.webrtc,
    updatedAt: r.updated_at,
  };
}

export function listExtensions(db: Database.Database): ExtensionRow[] {
  const rows = db
    .prepare(
      'SELECT number, display_name, secret, note, webrtc, updated_at FROM extensions ORDER BY number',
    )
    .all() as Raw[];
  return rows.map(map);
}

export function getExtension(db: Database.Database, number: string): ExtensionRow | null {
  const row = db
    .prepare(
      'SELECT number, display_name, secret, note, webrtc, updated_at FROM extensions WHERE number = ?',
    )
    .get(number) as Raw | undefined;
  return row ? map(row) : null;
}

export type UpsertExtensionInput = Readonly<{
  number: string;
  displayName?: string | null;
  secret: string;
  note?: string | null;
  webrtc?: boolean;
}>;

export function createExtension(db: Database.Database, input: UpsertExtensionInput): ExtensionRow {
  if (getExtension(db, input.number)) {
    throw duplicateError(`内線 ${input.number} は既に存在します`);
  }
  try {
    db.prepare(
      `INSERT INTO extensions (number, display_name, secret, note, webrtc, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    ).run(
      input.number,
      input.displayName ?? null,
      input.secret,
      input.note ?? null,
      input.webrtc ? 1 : 0,
    );
  } catch (e) {
    throw mapSqliteError(e);
  }
  return getExtension(db, input.number)!;
}

export function updateExtension(db: Database.Database, input: UpsertExtensionInput): ExtensionRow {
  if (!getExtension(db, input.number)) {
    throw notFoundError(`内線 ${input.number} は存在しません`);
  }
  db.prepare(
    `UPDATE extensions SET display_name = ?, secret = ?, note = ?, webrtc = ?, updated_at = datetime('now') WHERE number = ?`,
  ).run(
    input.displayName ?? null,
    input.secret,
    input.note ?? null,
    input.webrtc ? 1 : 0,
    input.number,
  );
  return getExtension(db, input.number)!;
}

export function deleteExtension(db: Database.Database, number: string): boolean {
  return db.prepare('DELETE FROM extensions WHERE number = ?').run(number).changes > 0;
}

function mapSqliteError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('UNIQUE')) return duplicateError(msg);
  if (msg.includes('FOREIGN KEY')) return constraintError(msg);
  return e instanceof Error ? e : new Error(msg);
}
