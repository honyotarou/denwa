'use server';

import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export async function createRingGroupAction(formData: FormData): Promise<void> {
  await flash('/ring-groups', '着信グループを追加しました', async () => {
    await H.createRingGroupActionImpl(await getRequestContext(), formData);
  });
}

export async function updateRingGroupAction(formData: FormData): Promise<void> {
  await flash('/ring-groups', '着信グループを更新しました', async () => {
    await H.updateRingGroupActionImpl(await getRequestContext(), formData);
  });
}

export async function deleteRingGroupAction(formData: FormData): Promise<void> {
  await flash('/ring-groups', '着信グループを削除しました', async () => {
    await H.deleteRingGroupActionImpl(await getRequestContext(), formData);
  });
}
