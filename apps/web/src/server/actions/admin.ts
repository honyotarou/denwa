import type { AppContext } from '../context.js';
import { audit, requireAdmin, requireSupervisor, s } from './shared.js';
import {
  deleteBillingRateWithAudit,
  updatePasswordPolicyWithAudit,
  upsertBillingRateWithAudit,
} from '../services/admin-policy';
import { deleteTrunkWithSync, upsertTrunkWithSync } from '../services/trunks';
import { deleteUpgradeWithAudit, scheduleUpgradeWithAudit } from '../services/upgrades';

export async function updatePolicyActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  updatePasswordPolicyWithAudit(ctx, me, {
    minLength: Number(s(formData.get('minLength')) || '8'),
    requireDigit: formData.get('requireDigit') === 'on',
  });
}

export async function upsertIpAllowActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const cidr = s(formData.get('cidr'));
  if (!ctx.auth.validateCidr(cidr)) throw new Error('invalid cidr');
  ctx.auth.upsertIpAllow(cidr, s(formData.get('note')) || undefined);
  audit(ctx, me, 'ip_allow.upsert', cidr);
}

export async function deleteIpAllowActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const cidr = s(formData.get('cidr'));
  if (!ctx.auth.deleteIpAllow(cidr)) throw new Error('not found');
  audit(ctx, me, 'ip_allow.delete', cidr);
}

export async function upsertRateActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireSupervisor(ctx);
  upsertBillingRateWithAudit(ctx, me, {
    prefix: s(formData.get('prefix')),
    perMin: Number(s(formData.get('perMin')) || '0'),
  });
}

export async function deleteRateActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireSupervisor(ctx);
  deleteBillingRateWithAudit(ctx, me, s(formData.get('prefix')));
}

export async function upsertTrunkActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  await upsertTrunkWithSync(ctx, me, { name: s(formData.get('name')), host: s(formData.get('host')) });
}

export async function deleteTrunkActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  await deleteTrunkWithSync(ctx, me, s(formData.get('name')));
}

export async function scheduleUpgradeActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  scheduleUpgradeWithAudit(ctx, me, {
    scheduledAt: s(formData.get('scheduledAt')),
    asteriskImage: s(formData.get('asteriskImage')),
  });
}

export async function deleteUpgradeActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  deleteUpgradeWithAudit(ctx, me, Number(s(formData.get('id'))));
}
