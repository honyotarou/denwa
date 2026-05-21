import type Database from 'better-sqlite3';
import { notFoundError } from '../errors.js';

export type PasswordPolicyRow = Readonly<{
  id: number;
  minLength: number;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireDigit: boolean;
  requireSymbol: boolean;
  rotationDays: number;
  lockoutThreshold: number;
}>;

type Raw = {
  id: number;
  min_length: number;
  require_lowercase: number;
  require_uppercase: number;
  require_digit: number;
  require_symbol: number;
  rotation_days: number;
  lockout_threshold: number;
};

function map(row: Raw): PasswordPolicyRow {
  return {
    id: row.id,
    minLength: row.min_length,
    requireLowercase: !!row.require_lowercase,
    requireUppercase: !!row.require_uppercase,
    requireDigit: !!row.require_digit,
    requireSymbol: !!row.require_symbol,
    rotationDays: row.rotation_days,
    lockoutThreshold: row.lockout_threshold,
  };
}

const SELECT =
  `SELECT id, min_length, require_lowercase, require_uppercase, require_digit, require_symbol,
          rotation_days, lockout_threshold FROM password_policies WHERE id = 1`;

export function getPasswordPolicy(db: Database.Database): PasswordPolicyRow {
  const row = db.prepare(SELECT).get() as Raw | undefined;
  if (!row) throw notFoundError('password_policies bootstrap missing');
  return map(row);
}

export type PasswordPolicyInput = Omit<PasswordPolicyRow, 'id'>;

export function updatePasswordPolicy(db: Database.Database, input: PasswordPolicyInput): void {
  db.prepare(
    `UPDATE password_policies SET
       min_length = ?, require_lowercase = ?, require_uppercase = ?,
       require_digit = ?, require_symbol = ?, rotation_days = ?,
       lockout_threshold = ?, updated_at = datetime('now')
     WHERE id = 1`,
  ).run(
    input.minLength,
    input.requireLowercase ? 1 : 0,
    input.requireUppercase ? 1 : 0,
    input.requireDigit ? 1 : 0,
    input.requireSymbol ? 1 : 0,
    input.rotationDays,
    input.lockoutThreshold,
  );
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
