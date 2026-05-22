import { PBX_CONFIG_WRITE_MIN_ROLE } from '@openpbx/core';
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

/** PBX 設定書込 — API と同一契約（T-SEC-A01-002） */
export function requirePbxConfigWrite(ctx: ActionContext) {
  return ctx.auth.requireMinRole(ctx.sessionToken, ctx.meta, PBX_CONFIG_WRITE_MIN_ROLE);
}
