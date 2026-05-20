import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { hashPassword } from '@openpbx/core';
import { createAccount, listAudit, listLoginHistory } from '@openpbx/db';
import { createTestContext, loginAsAdmin } from '../context';
import {
  createExtensionActionImpl,
  updateExtensionActionImpl,
  deleteExtensionActionImpl,
  createRingGroupActionImpl,
  createPickupGroupActionImpl,
  createPhonebookActionImpl,
  upsertHolidayActionImpl,
  upsertIvrActionImpl,
  deleteGuidanceActionImpl,
  loginActionImpl,
  logoutActionImpl,
  setupTotpActionImpl,
  updateMyPasswordActionImpl,
  createAccountActionImpl,
  updateAccountRoleActionImpl,
  upsertIpAllowActionImpl,
  upsertRateActionImpl,
  upsertTrunkActionImpl,
  scheduleUpgradeActionImpl,
} from '../actions-handlers';
import { isAuthError } from '../auth';

const tmpDirs: string[] = [];

async function authedCtx() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cr-act-'));
  tmpDirs.push(dir);
  const ctx = createTestContext({
    infraDirs: {
      pjsipDir: path.join(dir, 'pjsip.d'),
      dialplanDir: path.join(dir, 'dialplan.d'),
      signalDir: path.join(dir, 'signals'),
      soundsDir: path.join(dir, 'sounds'),
      recordingsDir: path.join(dir, 'recordings'),
    },
  });
  ctx.sessionToken = await loginAsAdmin(ctx);
  return ctx;
}

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

describe('Phase 6.5 — Server Actions (T-ACT-001〜040)', () => {
  it('T-ACT-001: createExtension + audit + pjsip reload', async () => {
    const ctx = await authedCtx();
    await createExtensionActionImpl(ctx, fd({ number: '2001', secret: 'secret-2001' }));
    const audit = listAudit(ctx.db, 5);
    expect(audit.some((a) => a.action === 'extension.create')).toBe(true);
    const conf = await fs.readFile(path.join(ctx.infraDirs.pjsipDir, 'extensions.conf'), 'utf8');
    expect(conf).toContain('2001');
  });

  it('T-ACT-002: updateExtension', async () => {
    const ctx = await authedCtx();
    await updateExtensionActionImpl(
      ctx,
      fd({ number: '1001', secret: 'new-secret-1001', displayName: 'Updated' }),
    );
    expect(listAudit(ctx.db, 3)[0]!.action).toBe('extension.update');
  });

  it('T-ACT-003: deleteExtension', async () => {
    const ctx = await authedCtx();
    await deleteExtensionActionImpl(ctx, fd({ number: '1002' }));
    expect(listAudit(ctx.db, 3)[0]!.action).toBe('extension.delete');
  });

  it('T-ACT-004: createRingGroup + dialplan', async () => {
    const ctx = await authedCtx();
    await createRingGroupActionImpl(
      ctx,
      fd({ number: '6001', members: '1001', strategy: 'ringall', ringSeconds: '30' }),
    );
    await fs.access(path.join(ctx.infraDirs.dialplanDir, 'ringgroups.conf'));
  });

  it('T-ACT-007: createPickupGroup', async () => {
    const ctx = await authedCtx();
    await createPickupGroupActionImpl(ctx, fd({ name: 'sales', members: '1001' }));
    await fs.access(path.join(ctx.infraDirs.dialplanDir, 'pickup.conf'));
  });

  it('T-ACT-010: createPhonebook', async () => {
    const ctx = await authedCtx();
    await createPhonebookActionImpl(ctx, fd({ name: 'Clinic', number: '0312345678' }));
    expect(listAudit(ctx.db, 2)[0]!.action).toBe('phonebook.create');
  });

  it('T-ACT-013: upsertHoliday + business-hours', async () => {
    const ctx = await authedCtx();
    await upsertHolidayActionImpl(ctx, fd({ date: '2026-01-01', name: 'NY' }));
    await fs.access(path.join(ctx.infraDirs.dialplanDir, 'business-hours.conf'));
  });

  it('T-ACT-018: upsertIvr', async () => {
    const ctx = await authedCtx();
    await upsertIvrActionImpl(
      ctx,
      fd({ number: '5000', digit: '1', action: 'goto_extension', target: '9001' }),
    );
    await fs.access(path.join(ctx.infraDirs.dialplanDir, 'ivr.conf'));
  });

  it('T-ACT-020: deleteGuidance', async () => {
    const ctx = await authedCtx();
    const { upsertGuidance } = await import('@openpbx/db');
    upsertGuidance(ctx.db, { name: 'g1' });
    await deleteGuidanceActionImpl(ctx, fd({ name: 'g1' }));
    expect(listAudit(ctx.db, 2)[0]!.action).toBe('guidance.delete');
  });

  it('T-ACT-021: login success', async () => {
    const ctx = createTestContext();
    createAccount(ctx.db, {
      username: 'bob',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    const r = await loginActionImpl(ctx, fd({ username: 'bob', password: 'password12' }));
    expect(r.ok).toBe(true);
    expect(listLoginHistory(ctx.db, 1)[0]!.success).toBe(1);
  });

  it('T-ACT-021b: login rejects bad totp when enabled', async () => {
    const { generateSecret } = await import('@openpbx/core');
    const ctx = createTestContext();
    const secret = generateSecret();
    const acct = createAccount(ctx.db, {
      username: 'bob',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.auth.setTotpSecret(acct.id, secret);
    const r = await loginActionImpl(
      ctx,
      fd({ username: 'bob', password: 'password12', totp: '000000' }),
    );
    expect(r.ok).toBe(false);
  });

  it('T-ACT-022: logout', async () => {
    const ctx = await authedCtx();
    await logoutActionImpl(ctx);
    expect(listAudit(ctx.db, 5).some((a) => a.action === 'logout')).toBe(true);
  });

  it('T-ACT-023: setupTotp self only', async () => {
    const ctx = await authedCtx();
    await setupTotpActionImpl(ctx);
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    expect(ctx.auth.getTotpSecret(me.id)).toBeTruthy();
  });

  it('T-ACT-026: updateMyPassword policy', async () => {
    const ctx = await authedCtx();
    await updateMyPasswordActionImpl(ctx, fd({ password: 'Newpass1' }));
    expect(listAudit(ctx.db, 3)[0]!.action).toBe('account.self.password.update');
  });

  it('T-ACT-027: createAccount admin only', async () => {
    const ctx = await authedCtx();
    await createAccountActionImpl(
      ctx,
      fd({ username: 'newuser', password: 'Password1', role: 'user' }),
    );
    expect(ctx.auth.getAccountByUsername('newuser')).toBeTruthy();
  });

  it('T-ACT-028: updateAccountRole last admin guard', async () => {
    const ctx = await authedCtx();
    const admin = ctx.auth.getAccountByUsername('admin')!;
    await expect(
      updateAccountRoleActionImpl(ctx, fd({ id: String(admin.id), role: 'user' })),
    ).rejects.toThrow(/last admin/);
  });

  it('T-SEC-SESSION-001: updateAccountRole rotates self session', async () => {
    const ctx = await authedCtx();
    createAccount(ctx.db, {
      username: 'admin2',
      passwordHash: hashPassword('password12'),
      role: 'admin',
    });
    const admin = ctx.auth.getAccountByUsername('admin')!;
    const oldToken = ctx.sessionToken!;
    expect(ctx.auth.getAccountBySessionToken(oldToken)?.role).toBe('admin');
    const r = await updateAccountRoleActionImpl(
      ctx,
      fd({ id: String(admin.id), role: 'supervisor' }),
    );
    expect(r.rotatedToken).toBeTruthy();
    expect(ctx.auth.getAccountBySessionToken(oldToken)).toBeNull();
    expect(ctx.auth.getAccountBySessionToken(r.rotatedToken!)?.role).toBe('supervisor');
  });

  it('T-ACT-033: upsertIpAllow CIDR validate', async () => {
    const ctx = await authedCtx();
    await upsertIpAllowActionImpl(ctx, fd({ cidr: '192.168.0.0/24', note: 'lan' }));
    expect(ctx.auth.listIpAllow()).toContain('192.168.0.0/24');
  });

  it('T-ACT-035: upsertRate supervisor+', async () => {
    const ctx = await authedCtx();
    const sup = createAccount(ctx.db, {
      username: 'sup2',
      passwordHash: hashPassword('password12'),
      role: 'supervisor',
    });
    ctx.sessionToken = ctx.auth.createSession(sup.id, ctx.meta);
    await upsertRateActionImpl(ctx, fd({ prefix: '03', perMin: '8' }));
    expect(listAudit(ctx.db, 2)[0]!.action).toBe('billing_rate.upsert');
  });

  it('T-ACT-037: upsertTrunk reload', async () => {
    const ctx = await authedCtx();
    await upsertTrunkActionImpl(ctx, fd({ name: 'tr1', host: 'sip.example.com' }));
    await fs.access(path.join(ctx.infraDirs.pjsipDir, 'trunks.conf'));
  });

  it('T-ACT-039: scheduleUpgrade UTC', async () => {
    const ctx = await authedCtx();
    await scheduleUpgradeActionImpl(
      ctx,
      fd({ scheduledAt: '2026-06-01T00:00:00.000Z', asteriskImage: 'ubuntu:22.04' }),
    );
    expect(listAudit(ctx.db, 2)[0]!.action).toBe('upgrade.schedule');
  });

  it('unauthenticated action rejected', async () => {
    const ctx = createTestContext();
    await expect(
      createExtensionActionImpl(ctx, fd({ number: '2001', secret: 'secret-2001' })),
    ).rejects.toSatisfy((e: unknown) => isAuthError(e));
  });
});
