import { describe, expect, it } from 'vitest';
import { createInMemoryDb, createAccount } from '../index.js';
import { recordLoginAttempt } from '../repos/audit.js';
import {
  countRecentLoginFailures,
  getLockoutPolicy,
} from '../repos/login-lockout.js';

describe('T-DB-LOCKOUT-001: login_history lockout counts', () => {
  it('Given 5 failures in window When count Then 5', () => {
    const db = createInMemoryDb();
    const policy = getLockoutPolicy(db);
    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(db, 'alice', false, { ip: '10.0.0.1' });
    }
    expect(countRecentLoginFailures(db, 'alice', policy.windowMinutes)).toBe(5);
  });
});
