import {
  validateHolidayDate,
  validateHolidayName,
  validateTimeRuleDraft,
  type TimeRuleDraft,
} from '@openpbx/core';
import {
  createTimeRule,
  deleteHoliday,
  deleteTimeRule,
  getTimeRule,
  updateTimeRule,
  upsertHoliday,
} from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../actions/shared';
import { throwIfInvalid, throwIfInvalidField } from './validate';

export async function upsertHolidayWithSync(
  ctx: AppContext,
  me: SessionAccount,
  date: string,
  name: string,
): Promise<void> {
  throwIfInvalidField(validateHolidayDate(date));
  throwIfInvalidField(validateHolidayName(name));
  upsertHoliday(ctx.db, date, name.trim());
  await ctx.infra.syncBusinessHours();
  audit(ctx, me, 'holiday.upsert', date);
}

export async function deleteHolidayWithSync(
  ctx: AppContext,
  me: SessionAccount,
  date: string,
): Promise<void> {
  deleteHoliday(ctx.db, date);
  await ctx.infra.syncBusinessHours();
  audit(ctx, me, 'holiday.delete', date);
}

export async function createTimeRuleWithSync(
  ctx: AppContext,
  me: SessionAccount,
  draft: TimeRuleDraft,
): Promise<void> {
  throwIfInvalid(validateTimeRuleDraft(draft));
  createTimeRule(ctx.db, {
    name: draft.name,
    days: draft.days,
    startTime: draft.startTime,
    endTime: draft.endTime,
  });
  await ctx.infra.syncBusinessHours();
  audit(ctx, me, 'time_rule.create');
}

export async function updateTimeRuleWithSync(
  ctx: AppContext,
  me: SessionAccount,
  id: number,
  patch: Partial<TimeRuleDraft>,
): Promise<void> {
  const existing = getTimeRule(ctx.db, id);
  if (!existing) throw new Error('not found');
  const draft: TimeRuleDraft = {
    name: patch.name ?? existing.name,
    days: patch.days ?? existing.days,
    startTime: patch.startTime ?? existing.startTime,
    endTime: patch.endTime ?? existing.endTime,
  };
  throwIfInvalid(validateTimeRuleDraft(draft));
  updateTimeRule(ctx.db, id, draft);
  await ctx.infra.syncBusinessHours();
  audit(ctx, me, 'time_rule.update');
}

export async function deleteTimeRuleWithSync(
  ctx: AppContext,
  me: SessionAccount,
  id: number,
): Promise<void> {
  deleteTimeRule(ctx.db, id);
  await ctx.infra.syncBusinessHours();
  audit(ctx, me, 'time_rule.delete');
}
