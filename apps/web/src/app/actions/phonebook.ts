'use server';

import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export async function createPhonebookAction(formData: FormData): Promise<void> {
  await flash('/phonebook', '電話帳に追加しました', async () => {
    await H.createPhonebookActionImpl(await getRequestContext(), formData);
  });
}

export async function updatePhonebookAction(formData: FormData): Promise<void> {
  await flash('/phonebook', '電話帳を更新しました', async () => {
    await H.updatePhonebookActionImpl(await getRequestContext(), formData);
  });
}

export async function deletePhonebookAction(formData: FormData): Promise<void> {
  await flash('/phonebook', '電話帳から削除しました', async () => {
    await H.deletePhonebookActionImpl(await getRequestContext(), formData);
  });
}
