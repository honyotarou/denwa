import type Database from 'better-sqlite3';
import { notFoundError } from '../errors.js';

export function listGrantedExtensionNumbers(
  db: Database.Database,
  accountId: number,
): string[] {
  const rows = db
    .prepare(
      'SELECT extension_number FROM account_extension_grants WHERE account_id = ? ORDER BY extension_number',
    )
    .all(accountId) as { extension_number: string }[];
  return rows.map((r) => r.extension_number);
}

export function grantExtensionToAccount(
  db: Database.Database,
  accountId: number,
  extensionNumber: string,
): void {
  db.prepare(
    `INSERT INTO account_extension_grants (account_id, extension_number, granted_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(account_id, extension_number) DO NOTHING`,
  ).run(accountId, extensionNumber);
}

export function revokeExtensionGrant(
  db: Database.Database,
  accountId: number,
  extensionNumber: string,
): void {
  const r = db
    .prepare(
      'DELETE FROM account_extension_grants WHERE account_id = ? AND extension_number = ?',
    )
    .run(accountId, extensionNumber);
  if (r.changes === 0) {
    throw notFoundError(`grant not found: ${accountId}/${extensionNumber}`);
  }
}
