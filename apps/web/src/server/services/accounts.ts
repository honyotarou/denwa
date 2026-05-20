import type { Role, SessionAccount } from '../auth';
import type { AppContext } from '../context';
import { audit } from '../audit';

export type UpdateAccountRoleResult = Readonly<{ rotatedToken?: string }>;

export function updateAccountRoleWithSession(
  ctx: AppContext,
  me: SessionAccount,
  targetId: number,
  role: Role,
): UpdateAccountRoleResult {
  const target = ctx.auth.getAccountById(targetId);
  if (target?.role === 'admin' && role !== 'admin' && ctx.auth.countAdmins(targetId) === 0) {
    throw new Error('last admin');
  }
  ctx.auth.updateRole(targetId, role);
  ctx.auth.destroySessionsForAccount(targetId);
  audit(ctx, me, 'account.role.update', String(targetId));
  if (targetId === me.id) {
    return { rotatedToken: ctx.auth.createSession(targetId, ctx.meta) };
  }
  return {};
}
