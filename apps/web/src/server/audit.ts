import type { AppContext } from './context';

/** Audit helper — lives below actions/services (no reverse deps). */
export function audit(
  ctx: Pick<AppContext, 'auth' | 'meta'>,
  me: { username: string },
  action: string,
  target?: string,
): void {
  ctx.auth.recordAudit({
    actor: me.username,
    action,
    target,
    ip: ctx.meta.ip,
    userAgent: ctx.meta.userAgent,
  });
}
