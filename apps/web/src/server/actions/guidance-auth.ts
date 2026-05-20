import { isIpAllowed } from '@openpbx/core';
import { deleteGuidance } from '@openpbx/db';
import type { AppContext } from '../context.js';
import { audit, requireUser, s } from './shared.js';

// T-ACT-020 guidance
export async function deleteGuidanceActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  deleteGuidance(ctx.db, s(formData.get('name')));
  audit(ctx, me, 'guidance.delete', s(formData.get('name')));
}

// T-ACT-021 login
export async function loginActionImpl(
  ctx: AppContext,
  formData: FormData,
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const username = s(formData.get('username'));
  const password = String(formData.get('password') ?? '');
  const allow = ctx.auth.listIpAllow();
  if (!isIpAllowed(ctx.meta.ip, allow)) {
    ctx.auth.recordLoginAttempt(username, false);
    return { ok: false, error: 'IP blocked' };
  }
  const acct = ctx.auth.getAccountByUsername(username);
  const hash = acct ? ctx.auth.getPasswordHash(acct.id) : null;
  if (!acct || !hash || !ctx.auth.verifyPassword(password, hash)) {
    ctx.auth.recordLoginAttempt(username, false);
    ctx.auth.recordAudit({
      actor: username,
      action: 'login.failed',
      ip: ctx.meta.ip,
      userAgent: ctx.meta.userAgent,
    });
    return { ok: false, error: 'invalid credentials' };
  }
  const token = ctx.auth.createSession(acct.id, ctx.meta);
  ctx.auth.recordLoginAttempt(username, true);
  ctx.auth.recordAudit({
    actor: username,
    action: 'login',
    ip: ctx.meta.ip,
    userAgent: ctx.meta.userAgent,
  });
  return { ok: true, token };
}

// T-ACT-022 logout
export async function logoutActionImpl(ctx: AppContext): Promise<void> {
  try {
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    audit(ctx, me, 'logout');
  } catch {
    /* noop */
  }
  if (ctx.sessionToken) ctx.auth.destroySession(ctx.sessionToken);
}

// T-ACT-023〜024 TOTP
export async function setupTotpActionImpl(ctx: AppContext): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  ctx.auth.setTotpSecret(me.id, ctx.auth.generateTotpSecret());
  audit(ctx, me, 'totp.setup');
}

export async function disableTotpActionImpl(ctx: AppContext): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  ctx.auth.setTotpSecret(me.id, null);
  audit(ctx, me, 'totp.disable');
}

