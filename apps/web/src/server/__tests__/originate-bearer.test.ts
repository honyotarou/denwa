import { describe, expect, it } from 'vitest';
import { hashClickToCallToken } from '@openpbx/core';
import { createClickToCallToken } from '@openpbx/db';
import { handleOriginatePost } from '../api/handlers/originate';
import { createTestContext, loginAsAdmin } from '../context';

describe('T-CHX originate bearer', () => {
  it('T-CHX-013: valid bearer audits as click2call:name', async () => {
    const ctx = await createTestContext();
    await loginAsAdmin(ctx);
    const admin = ctx.auth.getAccountByUsername('admin')!;
    const plain = 'bearer-test-token-abc';
    createClickToCallToken(ctx.db, {
      accountId: admin.id,
      name: 'laptop',
      tokenHash: hashClickToCallToken(plain),
      fromExtension: '1001',
    });
    ctx.bearerToken = plain;
    const r = await handleOriginatePost(ctx, { from: '1001', to: '1002' });
    expect(r.status).toBe(200);
  });

  it('T-CHX-014: wrong from returns 403', async () => {
    const ctx = await createTestContext();
    await loginAsAdmin(ctx);
    const admin = ctx.auth.getAccountByUsername('admin')!;
    const plain = 'tok2';
    createClickToCallToken(ctx.db, {
      accountId: admin.id,
      name: 'x',
      tokenHash: hashClickToCallToken(plain),
      fromExtension: '1001',
    });
    ctx.bearerToken = plain;
    const r = await handleOriginatePost(ctx, { from: '1002', to: '1003' });
    expect(r.status).toBe(403);
  });

  it('T-CHX-009: invalid bearer returns 401', async () => {
    const ctx = await createTestContext();
    ctx.bearerToken = 'not-a-real-token';
    const r = await handleOriginatePost(ctx, { from: '1001', to: '1002' });
    expect(r.status).toBe(401);
  });
});
