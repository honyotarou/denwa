'use server';

import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export async function createPickupGroupAction(formData: FormData): Promise<void> {
  await flash('/pickup-groups', 'ピックアップグループを追加しました', async () => {
    await H.createPickupGroupActionImpl(await getRequestContext(), formData);
  });
}

export async function updatePickupGroupAction(formData: FormData): Promise<void> {
  await flash('/pickup-groups', 'ピックアップグループを更新しました', async () => {
    await H.updatePickupGroupActionImpl(await getRequestContext(), formData);
  });
}

export async function deletePickupGroupAction(formData: FormData): Promise<void> {
  await flash('/pickup-groups', 'ピックアップグループを削除しました', async () => {
    await H.deletePickupGroupActionImpl(await getRequestContext(), formData);
  });
}
