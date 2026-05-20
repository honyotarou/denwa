import { DUMMY_PASSWORD_HASH, isIpAllowed } from '@openpbx/core';
import type { AppContext } from '../context';
import { audit } from '../audit';

export type LoginInput = Readonly<{
  username: string;
  password: string;
  totp?: string;
}>;

export type LoginResult =
  | Readonly<{ ok: true; token: string }>
  | Readonly<{ ok: false; error: string }>;

/** Single login use-case: lockout → IP → password (constant-time) → TOTP → session. */
export function authenticateLogin(
  ctx: Pick<AppContext, 'auth' | 'meta'>,
  input: LoginInput,
): LoginResult {
  const username = input.username.trim();
  const password = input.password;
  const meta = { ip: ctx.meta.ip, userAgent: ctx.meta.userAgent };

  if (ctx.auth.isLoginLocked(username, ctx.meta.ip)) {
    ctx.auth.recordLoginAttempt(username, false, meta);
    return { ok: false, error: 'too many login attempts' };
  }

  const allow = ctx.auth.listIpAllow();
  if (!isIpAllowed(ctx.meta.ip, allow)) {
    ctx.auth.recordLoginAttempt(username, false, meta);
    return { ok: false, error: 'IP blocked' };
  }

  const acct = ctx.auth.getAccountByUsername(username);
  const storedHash = acct ? ctx.auth.getPasswordHash(acct.id) : null;
  const hash = storedHash ?? DUMMY_PASSWORD_HASH;
  const passwordOk = ctx.auth.verifyPassword(password, hash);

  if (!acct || !storedHash || !passwordOk) {
    ctx.auth.recordLoginAttempt(username, false, meta);
    ctx.auth.recordAudit({
      actor: username,
      action: 'login.failed',
      ip: ctx.meta.ip,
      userAgent: ctx.meta.userAgent,
    });
    return { ok: false, error: 'invalid credentials' };
  }

  const totpSecret = ctx.auth.getTotpSecret(acct.id);
  if (totpSecret) {
    const code = (input.totp ?? '').trim();
    if (!code || !ctx.auth.verifyTotpCode(acct.id, totpSecret, code)) {
      ctx.auth.recordLoginAttempt(username, false, meta);
      ctx.auth.recordAudit({
        actor: username,
        action: 'login.failed.totp',
        ip: ctx.meta.ip,
        userAgent: ctx.meta.userAgent,
      });
      return { ok: false, error: 'invalid 2FA code' };
    }
  }

  const token = ctx.auth.createSession(acct.id, ctx.meta);
  ctx.auth.recordLoginAttempt(username, true, meta);
  audit(ctx, { username }, 'login');
  return { ok: true, token };
}
