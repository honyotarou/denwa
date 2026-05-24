import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { applySchema } from '../apply-schema.js';
import { createAccount } from '../repos/accounts.js';
import {
  createClickToCallToken,
  listClickToCallTokens,
  revokeAllActiveClickToCallTokens,
} from '../repos/click-to-call-tokens.js';

describe('T-SEC-C2C-001: revoke all active click-to-call tokens', () => {
  it('Given active tokens When revokeAllActiveClickToCallTokens Then all revoked', () => {
    const db = new Database(':memory:');
    applySchema(db);
    const acct = createAccount(db, {
      username: 'c2c',
      passwordHash: 'hash',
      role: 'admin',
    });
    createClickToCallToken(db, {
      accountId: acct.id,
      name: 't1',
      tokenHash: 'hash1',
      fromExtension: '1001',
    });
    createClickToCallToken(db, {
      accountId: acct.id,
      name: 't2',
      tokenHash: 'hash2',
      fromExtension: '1002',
    });
    expect(revokeAllActiveClickToCallTokens(db)).toBe(2);
    const rows = listClickToCallTokens(db, acct.id);
    expect(rows.every((r) => r.revokedAt !== null)).toBe(true);
    db.close();
  });
});
