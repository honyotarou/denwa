import {
  deleteBillingRate,
  updatePasswordPolicy,
  upsertBillingRate,
} from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';

export function updatePasswordPolicyWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  input: { minLength: number; requireDigit: boolean },
): void {
  updatePasswordPolicy(ctx.db, input);
  audit(ctx, me, 'policy.update');
}

export function upsertBillingRateWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  input: { prefix: string; perMin: number },
): void {
  upsertBillingRate(ctx.db, input);
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
