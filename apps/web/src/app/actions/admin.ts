'use server';

import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export async function updatePolicyAction(formData: FormData): Promise<void> {
  await flash('/security', 'ポリシーを保存しました', async () => {
    await H.updatePolicyActionImpl(await getRequestContext(), formData);
  });
}

export async function upsertIpAllowAction(formData: FormData): Promise<void> {
  await flash('/security', 'IP を追加しました', async () => {
    await H.upsertIpAllowActionImpl(await getRequestContext(), formData);
  });
}

export async function deleteIpAllowAction(formData: FormData): Promise<void> {
  await flash('/security', 'IP を削除しました', async () => {
    await H.deleteIpAllowActionImpl(await getRequestContext(), formData);
  });
}

export async function upsertRateAction(formData: FormData): Promise<void> {
  await flash('/billing', 'レートを保存しました', async () => {
    await H.upsertRateActionImpl(await getRequestContext(), formData);
  });
}

export async function deleteRateAction(formData: FormData): Promise<void> {
  await flash('/billing', 'レートを削除しました', async () => {
    await H.deleteRateActionImpl(await getRequestContext(), formData);
  });
}

export async function upsertTrunkAction(formData: FormData): Promise<void> {
  await flash('/trunks', 'トランクを保存しました', async () => {
    await H.upsertTrunkActionImpl(await getRequestContext(), formData);
  });
}

export async function deleteTrunkAction(formData: FormData): Promise<void> {
  await flash('/trunks', 'トランクを削除しました', async () => {
    await H.deleteTrunkActionImpl(await getRequestContext(), formData);
  });
}

export async function scheduleUpgradeAction(formData: FormData): Promise<void> {
  await flash('/upgrades', 'アップグレードを予約しました', async () => {
    await H.scheduleUpgradeActionImpl(await getRequestContext(), formData);
  });
}

export async function deleteUpgradeAction(formData: FormData): Promise<void> {
  await flash('/upgrades', '予約を削除しました', async () => {
    await H.deleteUpgradeActionImpl(await getRequestContext(), formData);
  });
}
