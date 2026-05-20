'use server';

import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export async function upsertHolidayAction(formData: FormData): Promise<void> {
  await flash('/business-hours', '祝日を保存しました', async () => {
    await H.upsertHolidayActionImpl(await getRequestContext(), formData);
  });
}

export async function deleteHolidayAction(formData: FormData): Promise<void> {
  await flash('/business-hours', '祝日を削除しました', async () => {
    await H.deleteHolidayActionImpl(await getRequestContext(), formData);
  });
}

export async function createTimeRuleAction(formData: FormData): Promise<void> {
  await flash('/business-hours', '時間帯ルールを追加しました', async () => {
    await H.createTimeRuleActionImpl(await getRequestContext(), formData);
  });
}

export async function updateTimeRuleAction(formData: FormData): Promise<void> {
  await flash('/business-hours', '時間帯ルールを更新しました', async () => {
    await H.updateTimeRuleActionImpl(await getRequestContext(), formData);
  });
}

export async function deleteTimeRuleAction(formData: FormData): Promise<void> {
  await flash('/business-hours', '時間帯ルールを削除しました', async () => {
    await H.deleteTimeRuleActionImpl(await getRequestContext(), formData);
  });
}
