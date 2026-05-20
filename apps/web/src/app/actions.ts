'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { mapActionError, mapLoginError } from '@/lib/flash';
import * as H from '@/server/actions-handlers';

async function flash(path: string, okMsg: string, fn: () => Promise<void>): Promise<never> {
  let errMsg: string | null = null;
  try {
    await fn();
  } catch (err) {
    errMsg = mapActionError(err);
    console.error(`[action] ${path}`, errMsg);
  }
  revalidatePath(path);
  const q = new URLSearchParams();
  if (errMsg) q.set('err', errMsg);
  else if (okMsg) q.set('ok', okMsg);
  redirect(q.toString() ? `${path}?${q.toString()}` : path);
}

function s(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

export async function loginAction(formData: FormData): Promise<void> {
  const ctx = await getRequestContext();
  const r = await H.loginActionImpl(ctx, formData);
  const next = s(formData.get('next')) || '/';
  if (!r.ok) {
    redirect(`/login?next=${encodeURIComponent(next)}&err=${encodeURIComponent(mapLoginError(r.error))}`);
  }
  const store = await cookies();
  store.set('cr_session', r.token!, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 });
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const ctx = await getRequestContext();
  await H.logoutActionImpl(ctx);
  const store = await cookies();
  store.delete('cr_session');
  redirect('/login');
}

export async function createExtensionAction(formData: FormData): Promise<void> {
  await flash('/extensions', '内線を追加しました', async () => {
    const ctx = await getRequestContext();
    await H.createExtensionActionImpl(ctx, formData);
  });
}

export async function updateExtensionAction(formData: FormData): Promise<void> {
  await flash('/extensions', '内線を更新しました', async () => {
    const ctx = await getRequestContext();
    await H.updateExtensionActionImpl(ctx, formData);
  });
}

export async function deleteExtensionAction(formData: FormData): Promise<void> {
  await flash('/extensions', '内線を削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteExtensionActionImpl(ctx, formData);
  });
}

export async function createRingGroupAction(formData: FormData): Promise<void> {
  await flash('/ring-groups', '着信グループを追加しました', async () => {
    const ctx = await getRequestContext();
    await H.createRingGroupActionImpl(ctx, formData);
  });
}

export async function updateRingGroupAction(formData: FormData): Promise<void> {
  await flash('/ring-groups', '着信グループを更新しました', async () => {
    const ctx = await getRequestContext();
    await H.updateRingGroupActionImpl(ctx, formData);
  });
}

export async function deleteRingGroupAction(formData: FormData): Promise<void> {
  await flash('/ring-groups', '着信グループを削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteRingGroupActionImpl(ctx, formData);
  });
}

export async function createPickupGroupAction(formData: FormData): Promise<void> {
  await flash('/pickup-groups', 'ピックアップグループを追加しました', async () => {
    const ctx = await getRequestContext();
    await H.createPickupGroupActionImpl(ctx, formData);
  });
}

export async function updatePickupGroupAction(formData: FormData): Promise<void> {
  await flash('/pickup-groups', 'ピックアップグループを更新しました', async () => {
    const ctx = await getRequestContext();
    await H.updatePickupGroupActionImpl(ctx, formData);
  });
}

export async function deletePickupGroupAction(formData: FormData): Promise<void> {
  await flash('/pickup-groups', 'ピックアップグループを削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deletePickupGroupActionImpl(ctx, formData);
  });
}

export async function createPhonebookAction(formData: FormData): Promise<void> {
  await flash('/phonebook', '電話帳に追加しました', async () => {
    const ctx = await getRequestContext();
    await H.createPhonebookActionImpl(ctx, formData);
  });
}

export async function updatePhonebookAction(formData: FormData): Promise<void> {
  await flash('/phonebook', '電話帳を更新しました', async () => {
    const ctx = await getRequestContext();
    await H.updatePhonebookActionImpl(ctx, formData);
  });
}

export async function deletePhonebookAction(formData: FormData): Promise<void> {
  await flash('/phonebook', '電話帳から削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deletePhonebookActionImpl(ctx, formData);
  });
}

export async function upsertHolidayAction(formData: FormData): Promise<void> {
  await flash('/business-hours', '祝日を保存しました', async () => {
    const ctx = await getRequestContext();
    await H.upsertHolidayActionImpl(ctx, formData);
  });
}

export async function deleteHolidayAction(formData: FormData): Promise<void> {
  await flash('/business-hours', '祝日を削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteHolidayActionImpl(ctx, formData);
  });
}

export async function createTimeRuleAction(formData: FormData): Promise<void> {
  await flash('/business-hours', '時間帯ルールを追加しました', async () => {
    const ctx = await getRequestContext();
    await H.createTimeRuleActionImpl(ctx, formData);
  });
}

export async function updateTimeRuleAction(formData: FormData): Promise<void> {
  await flash('/business-hours', '時間帯ルールを更新しました', async () => {
    const ctx = await getRequestContext();
    await H.updateTimeRuleActionImpl(ctx, formData);
  });
}

export async function deleteTimeRuleAction(formData: FormData): Promise<void> {
  await flash('/business-hours', '時間帯ルールを削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteTimeRuleActionImpl(ctx, formData);
  });
}

export async function upsertIvrAction(formData: FormData): Promise<void> {
  await flash('/ivr', 'IVR を保存しました', async () => {
    const ctx = await getRequestContext();
    await H.upsertIvrActionImpl(ctx, formData);
  });
}

export async function deleteIvrAction(formData: FormData): Promise<void> {
  await flash('/ivr', 'IVR を削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteIvrActionImpl(ctx, formData);
  });
}

export async function deleteGuidanceAction(formData: FormData): Promise<void> {
  await flash('/guidances', 'ガイダンスを削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteGuidanceActionImpl(ctx, formData);
  });
}

export async function setupTotpAction(): Promise<void> {
  await flash('/me', '2FA を有効にしました', async () => {
    const ctx = await getRequestContext();
    await H.setupTotpActionImpl(ctx);
  });
}

export async function disableTotpAction(): Promise<void> {
  await flash('/me', '2FA を無効にしました', async () => {
    const ctx = await getRequestContext();
    await H.disableTotpActionImpl(ctx);
  });
}

export async function updateMyDisplayNameAction(formData: FormData): Promise<void> {
  await flash('/me', '表示名を更新しました', async () => {
    const ctx = await getRequestContext();
    await H.updateMyDisplayNameActionImpl(ctx, formData);
  });
}

export async function updateMyPasswordAction(formData: FormData): Promise<void> {
  await flash('/me', 'パスワードを変更しました', async () => {
    const ctx = await getRequestContext();
    await H.updateMyPasswordActionImpl(ctx, formData);
  });
}

export async function createAccountAction(formData: FormData): Promise<void> {
  await flash('/accounts', 'アカウントを追加しました', async () => {
    const ctx = await getRequestContext();
    await H.createAccountActionImpl(ctx, formData);
  });
}

export async function updateAccountRoleAction(formData: FormData): Promise<void> {
  await flash('/accounts', 'ロールを更新しました', async () => {
    const ctx = await getRequestContext();
    await H.updateAccountRoleActionImpl(ctx, formData);
  });
}

export async function updateAccountDisplayNameAction(formData: FormData): Promise<void> {
  await flash('/accounts', '表示名を更新しました', async () => {
    const ctx = await getRequestContext();
    await H.updateAccountDisplayNameActionImpl(ctx, formData);
  });
}

export async function updateAccountPasswordAction(formData: FormData): Promise<void> {
  await flash('/accounts', 'パスワードを更新しました', async () => {
    const ctx = await getRequestContext();
    await H.updateAccountPasswordActionImpl(ctx, formData);
  });
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  await flash('/accounts', 'アカウントを削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteAccountActionImpl(ctx, formData);
  });
}

export async function updatePolicyAction(formData: FormData): Promise<void> {
  await flash('/security', 'ポリシーを保存しました', async () => {
    const ctx = await getRequestContext();
    await H.updatePolicyActionImpl(ctx, formData);
  });
}

export async function upsertIpAllowAction(formData: FormData): Promise<void> {
  await flash('/security', 'IP を追加しました', async () => {
    const ctx = await getRequestContext();
    await H.upsertIpAllowActionImpl(ctx, formData);
  });
}

export async function deleteIpAllowAction(formData: FormData): Promise<void> {
  await flash('/security', 'IP を削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteIpAllowActionImpl(ctx, formData);
  });
}

export async function upsertRateAction(formData: FormData): Promise<void> {
  await flash('/billing', 'レートを保存しました', async () => {
    const ctx = await getRequestContext();
    await H.upsertRateActionImpl(ctx, formData);
  });
}

export async function deleteRateAction(formData: FormData): Promise<void> {
  await flash('/billing', 'レートを削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteRateActionImpl(ctx, formData);
  });
}

export async function upsertTrunkAction(formData: FormData): Promise<void> {
  await flash('/trunks', 'トランクを保存しました', async () => {
    const ctx = await getRequestContext();
    await H.upsertTrunkActionImpl(ctx, formData);
  });
}

export async function deleteTrunkAction(formData: FormData): Promise<void> {
  await flash('/trunks', 'トランクを削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteTrunkActionImpl(ctx, formData);
  });
}

export async function scheduleUpgradeAction(formData: FormData): Promise<void> {
  await flash('/upgrades', 'アップグレードを予約しました', async () => {
    const ctx = await getRequestContext();
    await H.scheduleUpgradeActionImpl(ctx, formData);
  });
}

export async function deleteUpgradeAction(formData: FormData): Promise<void> {
  await flash('/upgrades', '予約を削除しました', async () => {
    const ctx = await getRequestContext();
    await H.deleteUpgradeActionImpl(ctx, formData);
  });
}
