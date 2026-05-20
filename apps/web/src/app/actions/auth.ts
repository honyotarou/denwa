'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getRequestContext } from '@/lib/auth';
import { mapLoginError } from '@/lib/flash';
import { loginActionImpl, logoutActionImpl } from '@/server/actions/guidance-auth';
import { safeRedirectPath } from '@/server/safe-redirect';
import { sessionCookieOptions } from '@/server/session-cookie';
import { formString } from './_flash';

export async function loginAction(formData: FormData): Promise<void> {
  const ctx = await getRequestContext();
  const r = await loginActionImpl(ctx, formData);
  const next = safeRedirectPath(formString(formData.get('next')));
  if (!r.ok) {
    redirect(`/login?next=${encodeURIComponent(next)}&err=${encodeURIComponent(mapLoginError(r.error))}`);
  }
  const store = await cookies();
  store.set('cr_session', r.token!, sessionCookieOptions());
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const ctx = await getRequestContext();
  await logoutActionImpl(ctx);
  const store = await cookies();
  store.delete('cr_session');
  redirect('/login');
}
