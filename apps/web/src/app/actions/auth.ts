'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getRequestContext } from '@/lib/auth';
import { mapLoginError } from '@/lib/flash';
import { loginActionImpl, logoutActionImpl } from '@/server/actions/guidance-auth';
import { formString } from './_flash';

export async function loginAction(formData: FormData): Promise<void> {
  const ctx = await getRequestContext();
  const r = await loginActionImpl(ctx, formData);
  const next = formString(formData.get('next')) || '/';
  if (!r.ok) {
    redirect(`/login?next=${encodeURIComponent(next)}&err=${encodeURIComponent(mapLoginError(r.error))}`);
  }
  const store = await cookies();
  store.set('cr_session', r.token!, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 });
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const ctx = await getRequestContext();
  await logoutActionImpl(ctx);
  const store = await cookies();
  store.delete('cr_session');
  redirect('/login');
}
