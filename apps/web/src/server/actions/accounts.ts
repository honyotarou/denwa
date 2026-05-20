import type { AppContext } from '../context.js';
import { audit, requireAdmin, s } from './shared.js';
import { updateAccountRoleWithSession } from '../services/accounts.js';

// T-ACT-025〜026 self
export async function updateMyDisplayNameActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  ctx.auth.updateDisplayName(me.id, s(formData.get('displayName')) || null);
  audit(ctx, me, 'account.self.display_name.update');
}

export async function updateMyPasswordActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  const pw = String(formData.get('password') ?? '');
  const errs = ctx.auth.validatePassword(pw);
  if (errs.length) throw new Error(errs.join('; '));
  ctx.auth.setPasswordHash(me.id, ctx.auth.hashPassword(pw));
  audit(ctx, me, 'account.self.password.update');
}

// T-ACT-027〜031 accounts
export async function createAccountActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  ctx.auth.createAccount({
    username: s(formData.get('username')),
    displayName: s(formData.get('displayName')) || undefined,
    passwordHash: ctx.auth.hashPassword(String(formData.get('password') ?? '')),
    role: (s(formData.get('role')) || 'user') as 'user' | 'supervisor' | 'admin',
  });
  audit(ctx, me, 'account.create', s(formData.get('username')));
}

export async function updateAccountRoleActionImpl(
  ctx: AppContext,
  formData: FormData,
): Promise<import('../services/accounts.js').UpdateAccountRoleResult> {
  const me = requireAdmin(ctx);
  const id = Number(s(formData.get('id')));
  const role = s(formData.get('role')) as 'user' | 'supervisor' | 'admin';
  return updateAccountRoleWithSession(ctx, me, id, role);
}

export async function updateAccountDisplayNameActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const id = Number(s(formData.get('id')));
  ctx.auth.updateDisplayName(id, s(formData.get('displayName')) || null);
  audit(ctx, me, 'account.display_name.update', String(id));
}

export async function updateAccountPasswordActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const id = Number(s(formData.get('id')));
  const pw = String(formData.get('password') ?? '');
  const errs = ctx.auth.validatePassword(pw);
  if (errs.length) throw new Error(errs.join('; '));
  ctx.auth.setPasswordHash(id, ctx.auth.hashPassword(pw));
  audit(ctx, me, 'account.password.update', String(id));
}

export async function deleteAccountActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const id = Number(s(formData.get('id')));
  const target = ctx.auth.getAccountById(id);
  if (target?.role === 'admin' && ctx.auth.countAdmins(id) === 0) throw new Error('last admin');
  if (!ctx.auth.deleteAccount(id)) throw new Error('not found');
  audit(ctx, me, 'account.delete', String(id));
}

