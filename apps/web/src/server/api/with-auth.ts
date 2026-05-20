import type { AppContext } from '../context';
import { isAuthError, type Role, type SessionAccount } from '../auth';
import type { JsonHandlerResult } from './types';

type AuthOptions = Readonly<{
  minRole?: Role;
  roles?: readonly Role[];
}>;

export function authErrorResponse(e: unknown): JsonHandlerResult {
  const status = isAuthError(e) ? e.status : 500;
  const message = isAuthError(e) ? e.message : 'internal error';
  return { status, body: { error: message } };
}

/** Run handler after session (+ optional role) check; maps AuthError to JSON. */
export async function withAuth(
  ctx: AppContext,
  handler: (me: SessionAccount) => JsonHandlerResult | Promise<JsonHandlerResult>,
  opts: AuthOptions = {},
): Promise<JsonHandlerResult> {
  try {
    let me: SessionAccount;
    if (opts.roles?.length) {
      me = ctx.auth.requireRole(ctx.sessionToken, ctx.meta, ...opts.roles);
    } else if (opts.minRole) {
      me = ctx.auth.requireMinRole(ctx.sessionToken, ctx.meta, opts.minRole);
    } else {
      me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    }
    return await handler(me);
  } catch (e) {
    return authErrorResponse(e);
  }
}
