import type { ActionContext } from '../context.js';

export { audit } from '../audit.js';

export function s(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function requireUser(ctx: ActionContext) {
  return ctx.auth.requireMinRole(ctx.sessionToken, ctx.meta, 'user');
}

export function requireAdmin(ctx: ActionContext) {
  return ctx.auth.requireRole(ctx.sessionToken, ctx.meta, 'admin');
}

export function requireSupervisor(ctx: ActionContext) {
  return ctx.auth.requireMinRole(ctx.sessionToken, ctx.meta, 'supervisor');
}
