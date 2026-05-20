import type { AppContext } from '../context.js';
import { requireUser, s } from './shared.js';
import {
  createTimeRuleWithSync,
  deleteHolidayWithSync,
  deleteTimeRuleWithSync,
  updateTimeRuleWithSync,
  upsertHolidayWithSync,
} from '../services/business-hours';

export async function upsertHolidayActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await upsertHolidayWithSync(ctx, me, s(formData.get('date')), s(formData.get('name')));
}

export async function deleteHolidayActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await deleteHolidayWithSync(ctx, me, s(formData.get('date')));
}

export async function createTimeRuleActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await createTimeRuleWithSync(ctx, me, {
    name: s(formData.get('name')),
    days: s(formData.get('days')) || 'mon-fri',
    startTime: s(formData.get('startTime')) || '09:00',
    endTime: s(formData.get('endTime')) || '18:00',
  });
}

export async function updateTimeRuleActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await updateTimeRuleWithSync(ctx, me, Number(s(formData.get('id'))), {
    name: s(formData.get('name')),
    days: s(formData.get('days')),
    startTime: s(formData.get('startTime')),
    endTime: s(formData.get('endTime')),
  });
}

export async function deleteTimeRuleActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await deleteTimeRuleWithSync(ctx, me, Number(s(formData.get('id'))));
}
