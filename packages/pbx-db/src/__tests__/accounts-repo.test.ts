import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { hashPassword } from '@openpbx/core';
import { applySchema } from '../apply-schema.js';
import {
  countAdmins,
  deleteAccount,
  getPasswordHash,
  setPasswordHash,
  setTotpSecret,
  getTotpSecret,
  updateAccountRole,
} from '../repos/accounts.js';

describe('accounts repository mutations', () => {
  it('setPasswordHash and getPasswordHash round-trip', () => {
    const db = new Database(':memory:');
    applySchema(db);
    db.prepare(
      `INSERT INTO accounts (username, display_name, role, password_hash) VALUES ('u', 'U', 'user', ?)`,
    ).run(hashPassword('old'));
    const id = (db.prepare(`SELECT id FROM accounts WHERE username = 'u'`).get() as { id: number }).id;
    const next = hashPassword('new-secret-value');
    setPasswordHash(db, id, next);
    expect(getPasswordHash(db, id)).toBe(next);
    db.close();
  });

  it('totp secret and role update', () => {
    const db = new Database(':memory:');
    applySchema(db);
    db.prepare(
      `INSERT INTO accounts (username, display_name, role, password_hash) VALUES ('a', 'A', 'user', ?)`,
    ).run(hashPassword('x'));
    const id = (db.prepare(`SELECT id FROM accounts WHERE username = 'a'`).get() as { id: number }).id;
    setTotpSecret(db, id, 'SECRET');
    expect(getTotpSecret(db, id)).toBe('SECRET');
    updateAccountRole(db, id, 'admin');
    expect(countAdmins(db)).toBe(1);
    db.close();
  });

  it('deleteAccount removes row', () => {
    const db = new Database(':memory:');
    applySchema(db);
    db.prepare(
      `INSERT INTO accounts (username, display_name, role, password_hash) VALUES ('d', 'D', 'user', ?)`,
    ).run(hashPassword('x'));
    const id = (db.prepare(`SELECT id FROM accounts WHERE username = 'd'`).get() as { id: number }).id;
    expect(deleteAccount(db, id)).toBe(true);
    expect(db.prepare(`SELECT COUNT(*) AS c FROM accounts`).get()).toEqual({ c: 0 });
    db.close();
  });
});
