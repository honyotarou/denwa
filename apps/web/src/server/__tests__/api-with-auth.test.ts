import { describe, expect, it } from 'vitest';
import { createTestContext, loginAsAdmin } from '../context';
import { withAuth, authErrorResponse } from '../api/with-auth';
import { authError, isAuthError } from '../auth';

describe('withAuth (T-API-AUTH-001)', () => {
  it('Given no session When withAuth Then 401 JSON', async () => {
    const ctx = createTestContext();
    const r = await withAuth(ctx, () => ({ status: 200, body: { ok: true } }));
    expect(r.status).toBe(401);
    expect(r.body).toMatchObject({ error: 'unauthorized' });
  });

  it('Given admin session When withAuth Then handler runs', async () => {
    const ctx = createTestContext();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await withAuth(ctx, (me) => ({
      status: 200,
      body: { user: me.username },
    }));
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ user: 'admin' });
  });

  it('Given user When minRole admin Then 403', async () => {
    const ctx = createTestContext();
    const { hashPassword } = await import('@openpbx/core');
    const { createAccount } = await import('@openpbx/db');
    const acct = createAccount(ctx.db, {
      username: 'u1',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(acct.id, ctx.meta);
    const r = await withAuth(ctx, () => ({ status: 200, body: {} }), { minRole: 'admin' });
    expect(r.status).toBe(403);
  });

  it('Given AuthError When authErrorResponse Then status preserved', () => {
    const r = authErrorResponse(authError(403, 'forbidden'));
    expect(r).toEqual({ status: 403, body: { error: 'forbidden' } });
  });
});
