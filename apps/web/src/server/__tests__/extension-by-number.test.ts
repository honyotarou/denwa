import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { hashPassword } from '@openpbx/core';
import { createAccount } from '@openpbx/db';
import { createTestContext, loginAsAdmin } from '../context';
import {
  handleExtensionByNumberDelete,
  handleExtensionByNumberGet,
  handleExtensionByNumberPut,
} from '../api/handlers/extension-by-number';
import { handleExtensionsPost } from '../api-handlers';

const tmpDirs: string[] = [];

async function mkTmpCtx() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cr-ext-num-'));
  tmpDirs.push(dir);
  return createTestContext({
    infraDirs: {
      pjsipDir: path.join(dir, 'pjsip.d'),
      dialplanDir: path.join(dir, 'dialplan.d'),
      signalDir: path.join(dir, 'signals'),
      soundsDir: path.join(dir, 'sounds'),
      recordingsDir: path.join(dir, 'recordings'),
    },
  });
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

describe('T-API-EXT-NUM: /api/extensions/[number]', () => {
  it('Given admin When GET 1001 Then 200', async () => {
    const ctx = await mkTmpCtx();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handleExtensionByNumberGet(ctx, '1001');
    expect(r.status).toBe(200);
    const body = r.body as { extension: { number: string } };
    expect(body.extension.number).toBe('1001');
  });

  it('Given admin When PUT Then updates displayName', async () => {
    const ctx = await mkTmpCtx();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handleExtensionByNumberPut(ctx, '1001', {
      secret: 'seed-secret-1001',
      displayName: 'Updated',
    });
    expect(r.status).toBe(200);
    const got = await handleExtensionByNumberGet(ctx, '1001');
    const body = got.body as { extension: { displayName: string | null } };
    expect(body.extension.displayName).toBe('Updated');
  });

  it('Given created ext When DELETE Then 404 on second get', async () => {
    const ctx = await mkTmpCtx();
    ctx.sessionToken = await loginAsAdmin(ctx);
    await handleExtensionsPost(ctx, { number: '2099', secret: 's2099' });
    const del = await handleExtensionByNumberDelete(ctx, '2099');
    expect(del.status).toBe(200);
    const got = await handleExtensionByNumberGet(ctx, '2099');
    expect(got.status).toBe(404);
  });

  it('Given no session When GET Then 401', async () => {
    const ctx = await mkTmpCtx();
    const r = await handleExtensionByNumberGet(ctx, '1001');
    expect(r.status).toBe(401);
  });

  it('Given unknown number When GET Then 404', async () => {
    const ctx = await mkTmpCtx();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handleExtensionByNumberGet(ctx, '9999');
    expect(r.status).toBe(404);
  });

  it('Given user When PUT Then forbidden', async () => {
    const ctx = await mkTmpCtx();
    const user = createAccount(ctx.db, {
      username: 'extuser',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(user.id, ctx.meta);
    const r = await handleExtensionByNumberPut(ctx, '1001', { secret: 'valid-secret12' });
    expect(r.status).toBe(403);
  });

  it('Given invalid secret When PUT Then 400', async () => {
    const ctx = await mkTmpCtx();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handleExtensionByNumberPut(ctx, '1001', { secret: 'x' });
    expect(r.status).toBe(400);
  });

  it('Given user When GET Then secret omitted', async () => {
    const ctx = await mkTmpCtx();
    const user = createAccount(ctx.db, {
      username: 'extview',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(user.id, ctx.meta);
    const r = await handleExtensionByNumberGet(ctx, '1001');
    const body = r.body as { extension: { secret?: string } };
    expect(body.extension.secret).toBeUndefined();
  });
});
