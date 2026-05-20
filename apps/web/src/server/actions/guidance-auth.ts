import type { ActionContext, AppContext } from '../context.js';
import { audit, requireUser, s } from './shared.js';
import { authenticateLogin } from '../services/auth-login';
import { deleteGuidanceWithAudit } from '../services/guidance';

// T-ACT-020 guidance
export async function deleteGuidanceActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  deleteGuidanceWithAudit(ctx, me, s(formData.get('name')));
}

// T-ACT-021 login
export async function loginActionImpl(
  ctx: ActionContext,
  formData: FormData,
): Promise<{ ok: boolean; token?: string; error?: string }> {
  return authenticateLogin(ctx, {
    username: s(formData.get('username')),
    password: String(formData.get('password') ?? ''),
    totp: s(formData.get('totp')) || undefined,
  });
}

// T-ACT-022 logout
export async function logoutActionImpl(ctx: ActionContext): Promise<void> {
  try {
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    audit(ctx, me, 'logout');
  } catch {
    /* noop */
  }
  if (ctx.sessionToken) ctx.auth.destroySession(ctx.sessionToken);
}

// T-ACT-023〜024 TOTP
export async function setupTotpActionImpl(ctx: ActionContext): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  ctx.auth.setTotpSecret(me.id, ctx.auth.generateTotpSecret());
  audit(ctx, me, 'totp.setup');
}

export async function disableTotpActionImpl(ctx: ActionContext): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  ctx.auth.setTotpSecret(me.id, null);
  audit(ctx, me, 'totp.disable');
}
