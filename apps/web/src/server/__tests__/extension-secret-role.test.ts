import { describe, expect, it } from 'vitest';
import { hashPassword, SECRET_MASK_DISPLAY } from '@openpbx/core';
import { createAccount, getExtension } from '@openpbx/db';
import { createTestContext, loginAsAdmin } from '../context';
import { updateExtensionActionImpl } from '../actions-handlers';
import { isAuthError } from '../auth';

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe('T-SEC extension secret update', () => {
  async function ctxWithExtensionSecret(secret: string) {
    const ctx = createTestContext();
    ctx.sessionToken = await loginAsAdmin(ctx);
    await updateExtensionActionImpl(
      ctx,
      fd({ number: '1001', secret, displayName: 'Seeded' }),
    );
    return ctx;
  }

  it('Given supervisor When update with empty secret Then preserves existing', async () => {
    const ctx = await ctxWithExtensionSecret('keep-this-secret');
    const sup = createAccount(ctx.db, {
      username: 'sup-ext',
      passwordHash: hashPassword('password12'),
      role: 'supervisor',
    });
    ctx.sessionToken = ctx.auth.createSession(sup.id, ctx.meta);
    await updateExtensionActionImpl(
      ctx,
      fd({ number: '1001', secret: '', displayName: 'Sup edit' }),
    );
    expect(getExtension(ctx.db, '1001')!.secret).toBe('keep-this-secret');
  });

  it('Given supervisor When update with mask secret Then preserves existing', async () => {
    const ctx = await ctxWithExtensionSecret('keep-this-secret');
    const sup = createAccount(ctx.db, {
      username: 'sup-ext2',
      passwordHash: hashPassword('password12'),
      role: 'supervisor',
    });
    ctx.sessionToken = ctx.auth.createSession(sup.id, ctx.meta);
    await updateExtensionActionImpl(
      ctx,
      fd({ number: '1001', secret: SECRET_MASK_DISPLAY, displayName: 'Sup edit' }),
    );
    expect(getExtension(ctx.db, '1001')!.secret).toBe('keep-this-secret');
  });
});

describe('T-SEC-A01-002: PBX config Server Actions require supervisor', () => {
  it('Given user When createExtensionAction Then forbidden', async () => {
    const ctx = createTestContext();
    const user = createAccount(ctx.db, {
      username: 'u-pbx',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(user.id, ctx.meta);
    await expect(
      updateExtensionActionImpl(ctx, fd({ number: '1001', secret: 'hack-secret' })),
    ).rejects.toSatisfy((e: unknown) => isAuthError(e) && e.status === 403);
  });
});
