import {
  deleteBillingRate,
  updatePasswordPolicy,
  upsertBillingRate,
  type PasswordPolicyInput,
} from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';

export function updatePasswordPolicyWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  input: PasswordPolicyInput,
): void {
  updatePasswordPolicy(ctx.db, input);
  audit(ctx, me, 'policy.update');
}

export function upsertBillingRateWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  input: { prefix: string; label?: string | null; perMin: number; setupFee?: number },
): void {
  upsertBillingRate(ctx.db, {
    prefix: input.prefix,
    label: input.label ?? undefined,
    perMin: input.perMin,
    setupFee: input.setupFee ?? 0,
  });
  audit(ctx, me, 'billing_rate.upsert', input.prefix);
}

export function deleteBillingRateWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  prefix: string,
): void {
  deleteBillingRate(ctx.db, prefix);
  audit(ctx, me, 'billing_rate.delete', prefix);
}
