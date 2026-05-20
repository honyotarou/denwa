'use server';

import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export async function setupTotpAction(): Promise<void> {
  await flash('/me', '2FA を有効にしました', async () => {
    await H.setupTotpActionImpl(await getRequestContext());
  });
}

export async function disableTotpAction(): Promise<void> {
  await flash('/me', '2FA を無効にしました', async () => {
    await H.disableTotpActionImpl(await getRequestContext());
  });
}

export async function updateMyDisplayNameAction(formData: FormData): Promise<void> {
  await flash('/me', '表示名を更新しました', async () => {
    await H.updateMyDisplayNameActionImpl(await getRequestContext(), formData);
  });
}

export async function updateMyPasswordAction(formData: FormData): Promise<void> {
  await flash('/me', 'パスワードを変更しました', async () => {
    await H.updateMyPasswordActionImpl(await getRequestContext(), formData);
  });
}
