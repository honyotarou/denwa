'use server';

import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export async function grantExtensionAction(formData: FormData): Promise<void> {
  await flash('/accounts', 'WebRTC 内線を割当しました', async () => {
    await H.grantExtensionActionImpl(await getRequestContext(), formData);
  });
}

export async function revokeExtensionGrantAction(formData: FormData): Promise<void> {
  await flash('/accounts', '内線割当を解除しました', async () => {
    await H.revokeExtensionGrantActionImpl(await getRequestContext(), formData);
  });
}
