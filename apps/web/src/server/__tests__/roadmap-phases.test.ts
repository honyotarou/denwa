/**
 * docs/TDD-REBUILD-PLAN.md Phase 6〜7, 9〜10（web 境界）の契約インデックス。
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { hashPassword, generateSecret, generateTotp } from '@openpbx/core';
import { createAccount, listAudit, upsertIpAllow } from '@openpbx/db';
import { middlewareDecision } from '../middleware-auth';
import {
  handleExtensionsGet,
  handleExtensionsPost,
  handleCdrIngestPost,
  handleOriginatePost,
} from '../api-handlers';
import { createTestContext, loginAsAdmin } from '../context';
import { createStubAmiOriginatePort } from '../ports/ami-originate';
import { authenticateLogin } from '../services/auth-login';
import { createRingGroupActionImpl } from '../actions-handlers';

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

describe('Phase 6: HTTP API', () => {
  it('Given 未ログイン When GET extensions Then 401', async () => {
    const ctx = createTestContext();
    const r = await handleExtensionsGet(ctx);
    expect(r.status).toBe(401);
  });

  it('Given admin When POST extensions Then 201 + pjsip', async () => {
    const ctx = createTestContext({ ami: createStubAmiOriginatePort() });
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handleExtensionsPost(ctx, { number: '2001', secret: 'secret-2001' });
    expect(r.status).toBe(201);
    expect(fs.existsSync(path.join(ctx.infraDirs.pjsipDir, 'extensions.conf'))).toBe(true);
  });

  it('Given user When GET extensions Then secret 非表示', async () => {
    const ctx = createTestContext();
    const user = createAccount(ctx.db, {
      username: 'u-ext',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(user.id, ctx.meta);
    const r = await handleExtensionsGet(ctx);
    expect(r.status).toBe(200);
    const body = r.body as { extensions: Array<{ secret: string }> };
    expect(body.extensions.every((e) => e.secret === '••••')).toBe(true);
  });

  it('Given supervisor When CDR ingest Then 200', async () => {
    const ctx = createTestContext();
    const sup = createAccount(ctx.db, {
      username: 'sup-cdr',
      passwordHash: hashPassword('password12'),
      role: 'supervisor',
    });
    ctx.sessionToken = ctx.auth.createSession(sup.id, ctx.meta);
    const r = await handleCdrIngestPost(ctx);
    expect(r.status).toBe(200);
  });

  it('Given supervisor When audit data Then listAudit ok', async () => {
    const ctx = createTestContext();
    const sup = createAccount(ctx.db, {
      username: 'sup-audit',
      passwordHash: hashPassword('password12'),
      role: 'supervisor',
    });
    const { recordAudit } = await import('@openpbx/db/repos/audit');
    recordAudit(ctx.db, {
      actor: sup.username,
      action: 'click2call',
      target: '1001->1002',
      ip: '127.0.0.1',
    });
    const rows = listAudit(ctx.db, 5);
    expect(rows.some((a) => a.action === 'click2call')).toBe(true);
    expect(ctx.auth.requireMinRole(ctx.auth.createSession(sup.id, ctx.meta), ctx.meta, 'supervisor').role).toBe(
      'supervisor',
    );
  });
});

describe('Phase 7: UI / Actions 境界', () => {
  it('Given admin session When middleware login path Then public', () => {
    expect(middlewareDecision({ pathname: '/login', hasSession: false, ipAllowed: true }).kind).toBe('next');
  });

  it('Given 2FA 有効 When valid TOTP Then session token', () => {
    const ctx = createTestContext();
    const secret = generateSecret();
    const acct = createAccount(ctx.db, {
      username: 'totp-user',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.auth.setTotpSecret(acct.id, secret);
    const code = generateTotp(secret, Date.now());
    const r = authenticateLogin(ctx, {
      username: 'totp-user',
      password: 'password12',
      totp: code,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.token).toBeTruthy();
  });

  it('Given 着信G When createRingGroupAction Then dialplan 反映', async () => {
    const ctx = createTestContext();
    ctx.sessionToken = await loginAsAdmin(ctx);
    await createRingGroupActionImpl(
      ctx,
      fd({ number: '6001', members: '1001', strategy: 'ringall', ringSeconds: '30' }),
    );
    expect(fs.existsSync(path.join(ctx.infraDirs.dialplanDir, 'ringgroups.conf'))).toBe(true);
  });
});

describe('Phase 9: originate API（T-API-009）', () => {
  it('Given admin When originate Then AMI stub ok', async () => {
    const originate = vi.fn(async () => ({ ok: true, raw: 'ok' }));
    const ctx = createTestContext({ ami: createStubAmiOriginatePort(originate) });
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handleOriginatePost(ctx, { from: '1001', to: '1002' });
    expect(r.status).toBe(200);
    expect(originate).toHaveBeenCalled();
  });
});

describe('Phase 10: IP 制限', () => {
  it('Given IP 制限外 When requireAccount Then 403', async () => {
    const ctx = createTestContext();
    const acct = createAccount(ctx.db, {
      username: 'ip-user',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    upsertIpAllow(ctx.db, '10.0.0.0/8', 'lab');
    const token = ctx.auth.createSession(acct.id, ctx.meta);
    expect(() => ctx.auth.requireAccount(token, { ip: '192.168.1.50' })).toThrow(/IP not allowed/);
  });
});
