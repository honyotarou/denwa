import type Database from 'better-sqlite3';
import { DuplicateError } from '../errors.js';

export type AccountRow = Readonly<{
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  createdAt: string;
}>;

type Raw = {
  id: number;
  username: string;
  display_name: string | null;
  role: string;
  created_at: string;
};

const map = (r: Raw): AccountRow => ({
  id: r.id,
  username: r.username,
  displayName: r.display_name,
  role: r.role,
  createdAt: r.created_at,
});

export function createAccount(
  db: Database.Database,
  input: { username: string; displayName?: string; passwordHash: string; role?: string },
): AccountRow {
  if (getAccountByUsername(db, input.username)) {
    throw new DuplicateError(`username 重複: ${input.username}`);
  }
  db.prepare(
    `INSERT INTO accounts (username, display_name, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
  ).run(input.username, input.displayName ?? null, input.passwordHash, input.role ?? 'user');
  return getAccountByUsername(db, input.username)!;
}

export function getAccountByUsername(db: Database.Database, username: string): AccountRow | null {
  const row = db
    .prepare('SELECT id, username, display_name, role, created_at FROM accounts WHERE username = ?')
    .get(username) as Raw | undefined;
  return row ? map(row) : null;
}

export function getAccountById(db: Database.Database, id: number): AccountRow | null {
  const row = db
    .prepare('SELECT id, username, display_name, role, created_at FROM accounts WHERE id = ?')
    .get(id) as Raw | undefined;
  return row ? map(row) : null;
}
