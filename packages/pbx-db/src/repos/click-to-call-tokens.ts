import type Database from 'better-sqlite3';
import { duplicateError, notFoundError } from '../errors.js';

export type ClickToCallTokenRow = Readonly<{
  id: number;
  accountId: number;
  name: string;
  fromExtension: string;
  createdAt: string;
  revokedAt: string | null;
}>;

type Raw = {
  id: number;
  account_id: number;
  name: string;
  from_extension: string;
  created_at: string;
  revoked_at: string | null;
};

function map(r: Raw): ClickToCallTokenRow {
  return {
    id: r.id,
    accountId: r.account_id,
    name: r.name,
    fromExtension: r.from_extension,
    createdAt: r.created_at,
    revokedAt: r.revoked_at,
  };
}

export function listClickToCallTokens(
  db: Database.Database,
  accountId: number,
): ClickToCallTokenRow[] {
  const rows = db
    .prepare(
      `SELECT id, account_id, name, from_extension, created_at, revoked_at
       FROM click_to_call_tokens WHERE account_id = ? ORDER BY created_at DESC`,
    )
    .all(accountId) as Raw[];
  return rows.map(map);
}

export function createClickToCallToken(
  db: Database.Database,
  input: Readonly<{
    accountId: number;
    name: string;
    tokenHash: string;
    fromExtension: string;
  }>,
): ClickToCallTokenRow {
  try {
    db.prepare(
      `INSERT INTO click_to_call_tokens (account_id, name, token_hash, from_extension, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
    ).run(input.accountId, input.name, input.tokenHash, input.fromExtension);
  } catch (e) {
    if (String(e).includes('UNIQUE')) {
      throw duplicateError('トークン名が重複しています');
    }
    throw e;
  }
  const row = db
    .prepare(
      `SELECT id, account_id, name, from_extension, created_at, revoked_at
       FROM click_to_call_tokens WHERE account_id = ? AND name = ?`,
    )
    .get(input.accountId, input.name) as Raw;
  return map(row);
}

export function revokeClickToCallToken(db: Database.Database, id: number, accountId: number): void {
  const r = db
    .prepare(
      `UPDATE click_to_call_tokens SET revoked_at = datetime('now')
       WHERE id = ? AND account_id = ? AND revoked_at IS NULL`,
    )
    .run(id, accountId);
  if (r.changes === 0) throw notFoundError('token not found or already revoked');
}

export type ClickToCallTokenAuthRow = Readonly<{
  id: number;
  accountId: number;
  name: string;
  fromExtension: string;
  tokenHash: string;
}>;

export function findActiveClickToCallTokenByHash(
  db: Database.Database,
  tokenHash: string,
): ClickToCallTokenAuthRow | null {
  const row = db
    .prepare(
      `SELECT id, account_id, name, from_extension, token_hash
       FROM click_to_call_tokens
       WHERE token_hash = ? AND revoked_at IS NULL`,
    )
    .get(tokenHash) as
    | {
        id: number;
        account_id: number;
        name: string;
        from_extension: string;
        token_hash: string;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    fromExtension: row.from_extension,
    tokenHash: row.token_hash,
  };
}
