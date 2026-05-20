import type Database from 'better-sqlite3';
import { duplicateError } from '../errors.js';

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
    throw duplicateError(`username 重複: ${input.username}`);
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

export function getPasswordHash(db: Database.Database, accountId: number): string | null {
  const row = db.prepare('SELECT password_hash FROM accounts WHERE id = ?').get(accountId) as
    | { password_hash: string }
    | undefined;
  return row?.password_hash ?? null;
}

export function setPasswordHash(db: Database.Database, accountId: number, hash: string): void {
  db.prepare(`UPDATE accounts SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
    hash,
    accountId,
  );
}

export function updateAccountDisplayName(
  db: Database.Database,
  accountId: number,
  displayName: string | null,
): void {
  db.prepare(`UPDATE accounts SET display_name = ?, updated_at = datetime('now') WHERE id = ?`).run(
    displayName,
    accountId,
  );
}

export function updateAccountRole(db: Database.Database, accountId: number, role: string): void {
  db.prepare(`UPDATE accounts SET role = ?, updated_at = datetime('now') WHERE id = ?`).run(role, accountId);
}

export function countAdmins(db: Database.Database, excludeId?: number): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM accounts WHERE role = 'admin' ${excludeId ? 'AND id != ?' : ''}`,
    )
    .get(...(excludeId ? [excludeId] : [])) as { c: number };
  return row.c;
}

export function getTotpSecret(db: Database.Database, accountId: number): string | null {
  const row = db.prepare('SELECT totp_secret FROM accounts WHERE id = ?').get(accountId) as
    | { totp_secret: string | null }
    | undefined;
  return row?.totp_secret ?? null;
}

export function setTotpSecret(db: Database.Database, accountId: number, secret: string | null): void {
  db.prepare(
    `UPDATE accounts SET totp_secret = ?, totp_last_counter = NULL, updated_at = datetime('now') WHERE id = ?`,
  ).run(secret, accountId);
}

export function getTotpLastCounter(db: Database.Database, accountId: number): number | null {
  const row = db.prepare('SELECT totp_last_counter FROM accounts WHERE id = ?').get(accountId) as
    | { totp_last_counter: number | null }
    | undefined;
  return row?.totp_last_counter ?? null;
}

export function setTotpLastCounter(db: Database.Database, accountId: number, counter: number): void {
  db.prepare(
    `UPDATE accounts SET totp_last_counter = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(counter, accountId);
}

export function deleteAccount(db: Database.Database, accountId: number): boolean {
  return db.prepare('DELETE FROM accounts WHERE id = ?').run(accountId).changes > 0;
}
