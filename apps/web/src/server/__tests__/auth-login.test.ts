import { hashPassword, generateSecret, generateTotp } from '@openpbx/core';
import { createAccount, listLoginHistory } from '@openpbx/db';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../context';
import { authenticateLogin } from '../services/auth-login';

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

describe('authenticateLogin (T-ACT-021)', () => {
  it('Given 5 failures When 6th login Then lockout', () => {
    const ctx = createTestContext();
    createAccount(ctx.db, {
      username: 'bob',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    for (let i = 0; i < 5; i++) {
      const r = authenticateLogin(ctx, { username: 'bob', password: 'wrong' });
      expect(r.ok).toBe(false);
    }
    const locked = authenticateLogin(ctx, { username: 'bob', password: 'wrong' });
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.error).toMatch(/too many/i);
  });

  it('Given valid credentials When no TOTP secret Then session token', () => {
    const ctx = createTestContext();
    createAccount(ctx.db, {
      username: 'bob',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    const r = authenticateLogin(ctx, {
      username: 'bob',
      password: 'password12',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.token).toBeTruthy();
    expect(listLoginHistory(ctx.db, 1)[0]!.success).toBe(1);
  });

  it('Given TOTP enabled When wrong code Then login fails', () => {
    const ctx = createTestContext();
    const secret = generateSecret();
    const acct = createAccount(ctx.db, {
      username: 'bob',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.auth.setTotpSecret(acct.id, secret);
    const r = authenticateLogin(ctx, {
      username: 'bob',
      password: 'password12',
      totp: '000000',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/totp|2fa/i);
    expect(listLoginHistory(ctx.db, 1)[0]!.success).toBe(0);
  });

  it('Given TOTP enabled When valid code Then session token', () => {
    const ctx = createTestContext();
    const secret = generateSecret();
    const time = Date.now();
    const acct = createAccount(ctx.db, {
      username: 'bob',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.auth.setTotpSecret(acct.id, secret);
    const code = generateTotp(secret, time);
    const r = authenticateLogin(ctx, {
      username: 'bob',
      password: 'password12',
      totp: code,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.token).toBeTruthy();
  });

  it('Given TOTP enabled When code omitted Then login fails', () => {
    const ctx = createTestContext();
    const secret = generateSecret();
    const acct = createAccount(ctx.db, {
      username: 'bob',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.auth.setTotpSecret(acct.id, secret);
    const r = authenticateLogin(ctx, {
      username: 'bob',
      password: 'password12',
    });
    expect(r.ok).toBe(false);
  });
});

describe('loginActionImpl wires authenticateLogin', () => {
  it('Given formData with totp When TOTP required Then uses service', async () => {
    const { loginActionImpl } = await import('../actions/guidance-auth');
    const ctx = createTestContext();
    const secret = generateSecret();
    const acct = createAccount(ctx.db, {
      username: 'bob',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.auth.setTotpSecret(acct.id, secret);
    const code = generateTotp(secret);
    const r = await loginActionImpl(
      ctx,
      fd({ username: 'bob', password: 'password12', totp: code }),
    );
    expect(r.ok).toBe(true);
  });
});
