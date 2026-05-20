'use server';

import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export async function upsertIvrAction(formData: FormData): Promise<void> {
  await flash('/ivr', 'IVR を保存しました', async () => {
    await H.upsertIvrActionImpl(await getRequestContext(), formData);
  });
}

export async function deleteIvrAction(formData: FormData): Promise<void> {
  await flash('/ivr', 'IVR を削除しました', async () => {
    await H.deleteIvrActionImpl(await getRequestContext(), formData);
  });
}
