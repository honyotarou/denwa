'use server';

import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export async function createExtensionAction(formData: FormData): Promise<void> {
  await flash('/extensions', '内線を追加しました', async () => {
    await H.createExtensionActionImpl(await getRequestContext(), formData);
  });
}

export async function updateExtensionAction(formData: FormData): Promise<void> {
  await flash('/extensions', '内線を更新しました', async () => {
    await H.updateExtensionActionImpl(await getRequestContext(), formData);
  });
}

export async function deleteExtensionAction(formData: FormData): Promise<void> {
  await flash('/extensions', '内線を削除しました', async () => {
    await H.deleteExtensionActionImpl(await getRequestContext(), formData);
  });
}
