import crypto from 'node:crypto';
import type Database from 'better-sqlite3';
import { getAccountById, type AccountRow } from './accounts.js';

export function createSessionToken(
  db: Database.Database,
  accountId: number,
  opts?: { ttlHours?: number; userAgent?: string; ip?: string },
): string {
  const token = crypto.randomBytes(32).toString('hex');
  const hours = opts?.ttlHours ?? 12;
  const expires = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  db.prepare(
    `INSERT INTO sessions (token, account_id, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?)`,
  ).run(token, accountId, expires, opts?.userAgent ?? null, opts?.ip ?? null);
  return token;
}

export function getAccountBySessionToken(db: Database.Database, token: string): AccountRow | null {
  const row = db
    .prepare(
      `SELECT a.id, a.username, a.display_name, a.role, a.created_at
         FROM sessions s
         JOIN accounts a ON a.id = s.account_id
        WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')`,
    )
    .get(token) as
    | { id: number; username: string; display_name: string | null; role: string; created_at: string }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function getAccountBySessionTokenIncludingExpired(
  db: Database.Database,
  token: string,
): AccountRow | null {
  const row = db.prepare('SELECT account_id FROM sessions WHERE token = ?').get(token) as
    | { account_id: number }
    | undefined;
  if (!row) return null;
  return getAccountById(db, row.account_id);
}

export function destroySession(db: Database.Database, token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function destroySessionsForAccount(db: Database.Database, accountId: number): void {
  db.prepare('DELETE FROM sessions WHERE account_id = ?').run(accountId);
}

export function countSessionsForAccount(db: Database.Database, accountId: number): number {
  const row = db
    .prepare('SELECT COUNT(*) AS c FROM sessions WHERE account_id = ?')
    .get(accountId) as { c: number };
  return row.c;
}
