import { hashPassword } from '@openpbx/core';
import { createAccount } from '@openpbx/db';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../context';
import { handleExtensionsPost } from '../api/handlers/extensions';
import { handleGuidancesPost } from '../api/handlers/guidance';

describe('T-SEC-A01-001: PBX config write requires supervisor', () => {
  it('Given user role When POST extensions Then 403', async () => {
    const ctx = createTestContext();
    const acct = createAccount(ctx.db, {
      username: 'u1',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(acct.id, ctx.meta);
    const r = await handleExtensionsPost(ctx, {
      number: '2099',
      secret: 'secret-2099',
    });
    expect(r.status).toBe(403);
  });

  it('Given user role When POST guidances Then 403', async () => {
    const ctx = createTestContext();
    const acct = createAccount(ctx.db, {
      username: 'u2',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(acct.id, ctx.meta);
    const r = await handleGuidancesPost(ctx, 'test.wav', new Uint8Array([0, 1, 2]));
    expect(r.status).toBe(403);
  });
});
