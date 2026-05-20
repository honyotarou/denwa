'use server';

import { cookies } from 'next/headers';
import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { sessionCookieOptions } from '@/server/session-cookie';
import { flash } from './_flash';

export async function createAccountAction(formData: FormData): Promise<void> {
  await flash('/accounts', 'アカウントを追加しました', async () => {
    await H.createAccountActionImpl(await getRequestContext(), formData);
  });
}

export async function updateAccountRoleAction(formData: FormData): Promise<void> {
  await flash('/accounts', 'ロールを更新しました', async () => {
    const r = await H.updateAccountRoleActionImpl(await getRequestContext(), formData);
    if (r.rotatedToken) {
      const store = await cookies();
      store.set('cr_session', r.rotatedToken, sessionCookieOptions());
    }
  });
}

export async function updateAccountDisplayNameAction(formData: FormData): Promise<void> {
  await flash('/accounts', '表示名を更新しました', async () => {
    await H.updateAccountDisplayNameActionImpl(await getRequestContext(), formData);
  });
}

export async function updateAccountPasswordAction(formData: FormData): Promise<void> {
  await flash('/accounts', 'パスワードを更新しました', async () => {
    await H.updateAccountPasswordActionImpl(await getRequestContext(), formData);
  });
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  await flash('/accounts', 'アカウントを削除しました', async () => {
    await H.deleteAccountActionImpl(await getRequestContext(), formData);
  });
}
