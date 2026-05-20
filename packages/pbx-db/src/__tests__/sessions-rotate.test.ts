import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { hashPassword } from '@openpbx/core';
import { applySchema } from '../apply-schema.js';
import { createAccount } from '../repos/accounts.js';
import {
  countSessionsForAccount,
  createSessionToken,
  destroySessionsForAccount,
} from '../repos/sessions.js';

describe('T-SEC-SESSION-001: destroy sessions on privilege change', () => {
  it('Given active sessions When destroySessionsForAccount Then count zero', () => {
    const db = new Database(':memory:');
    applySchema(db);
    const acct = createAccount(db, {
      username: 'bob',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    createSessionToken(db, acct.id);
    createSessionToken(db, acct.id);
    expect(countSessionsForAccount(db, acct.id)).toBe(2);
    destroySessionsForAccount(db, acct.id);
    expect(countSessionsForAccount(db, acct.id)).toBe(0);
    db.close();
  });
});
