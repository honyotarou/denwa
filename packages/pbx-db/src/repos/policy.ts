import type Database from 'better-sqlite3';
import { notFoundError } from '../errors.js';

export type PasswordPolicyRow = Readonly<{
  id: number;
  minLength: number;
  requireDigit: boolean;
}>;

export function getPasswordPolicy(db: Database.Database): PasswordPolicyRow {
  const row = db
    .prepare(
      'SELECT id, min_length, require_digit FROM password_policies WHERE id = 1',
    )
    .get() as { id: number; min_length: number; require_digit: number } | undefined;
  if (!row) throw notFoundError('password_policies bootstrap missing');
  return { id: row.id, minLength: row.min_length, requireDigit: !!row.require_digit };
}

export function upsertIpAllow(db: Database.Database, cidr: string, note?: string): void {
  db.prepare(
    `INSERT INTO ip_allow_list (cidr, note, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(cidr) DO UPDATE SET note = excluded.note, updated_at = datetime('now')`,
  ).run(cidr, note ?? null);
}

export function deleteIpAllow(db: Database.Database, cidr: string): boolean {
  return db.prepare('DELETE FROM ip_allow_list WHERE cidr = ?').run(cidr).changes > 0;
}

export function listIpAllow(db: Database.Database): string[] {
  return (db.prepare('SELECT cidr FROM ip_allow_list ORDER BY cidr').all() as Array<{ cidr: string }>).map(
    (r) => r.cidr,
  );
}

export function updatePasswordPolicy(
  db: Database.Database,
  input: { minLength: number; requireDigit: boolean },
): void {
  db.prepare(
    `UPDATE password_policies SET min_length = ?, require_digit = ?, updated_at = datetime('now') WHERE id = 1`,
  ).run(input.minLength, input.requireDigit ? 1 : 0);
}
