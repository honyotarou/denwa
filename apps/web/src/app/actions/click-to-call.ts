'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { mapActionError } from '@/lib/flash';
import * as H from '@/server/actions-handlers';
import { flash } from './_flash';

export type CreateTokenResult =
  | Readonly<{ ok: true; plain: string }>
  | Readonly<{ ok: false; error: string }>;

export async function createClickToCallTokenAction(
  formData: FormData,
): Promise<CreateTokenResult> {
  try {
    const r = await H.createClickToCallTokenActionImpl(await getRequestContext(), formData);
    revalidatePath('/me');
    return { ok: true, plain: r.plain };
  } catch (err) {
    return { ok: false, error: mapActionError(err) };
  }
}

export async function revokeClickToCallTokenAction(formData: FormData): Promise<void> {
  await flash('/me', 'トークンを失効しました', async () => {
    await H.revokeClickToCallTokenActionImpl(await getRequestContext(), formData);
  });
}
