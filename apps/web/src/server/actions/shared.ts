import type { AppContext } from '../context.js';

export function s(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function requireUser(ctx: AppContext) {
  return ctx.auth.requireMinRole(ctx.sessionToken, ctx.meta, 'user');
}

export function requireAdmin(ctx: AppContext) {
  return ctx.auth.requireRole(ctx.sessionToken, ctx.meta, 'admin');
}

export function requireSupervisor(ctx: AppContext) {
  return ctx.auth.requireMinRole(ctx.sessionToken, ctx.meta, 'supervisor');
}

export function audit(ctx: AppContext, me: { username: string }, action: string, target?: string) {
  ctx.auth.recordAudit({
    actor: me.username,
    action,
    target,
    ip: ctx.meta.ip,
    userAgent: ctx.meta.userAgent,
  });
}
