'use server';

import { getRequestContext } from '@/lib/auth';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export async function deleteGuidanceAction(formData: FormData): Promise<void> {
  await flash('/guidances', 'ガイダンスを削除しました', async () => {
    await H.deleteGuidanceActionImpl(await getRequestContext(), formData);
  });
}
