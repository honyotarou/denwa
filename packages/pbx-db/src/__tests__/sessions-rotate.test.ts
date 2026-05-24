import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { hashPassword } from '@openpbx/core';
import { applySchema } from '../apply-schema.js';
import { createAccount } from '../repos/accounts.js';
import {
  countSessionsForAccount,
  createSessionToken,
  destroyAllSessions,
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

  it('T-SEC-SESSION-002: Given sessions When destroyAllSessions Then table empty', () => {
    const db = new Database(':memory:');
    applySchema(db);
    const a = createAccount(db, {
      username: 'a1',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    const b = createAccount(db, {
      username: 'b1',
      passwordHash: hashPassword('password12'),
      role: 'admin',
    });
    createSessionToken(db, a.id);
    createSessionToken(db, b.id);
    expect(destroyAllSessions(db)).toBe(2);
    expect(countSessionsForAccount(db, a.id)).toBe(0);
    expect(countSessionsForAccount(db, b.id)).toBe(0);
    db.close();
  });
});
