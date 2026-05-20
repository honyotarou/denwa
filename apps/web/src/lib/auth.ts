import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  buildContext,
  sessionTokenFromCookieHeader,
} from '@/server/app-context';
import { AuthError, type Role, type SessionAccount } from '@/server/auth';

export type { Role };
export type Account = SessionAccount & { totpEnabled: boolean };

export async function getRequestContext() {
  const h = await headers();
  const token = sessionTokenFromCookieHeader(h.get('cookie'));
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  return buildContext(token, { ip });
}

export async function getCurrentAccount(): Promise<Account | null> {
  const ctx = await getRequestContext();
  const a = ctx.auth.getAccountBySessionToken(ctx.sessionToken);
  if (!a) return null;
  return {
    ...a,
    totpEnabled: !!ctx.auth.getTotpSecret(a.id),
  };
}

export async function requireAccount(): Promise<Account> {
  const ctx = await getRequestContext();
  const a = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  return { ...a, totpEnabled: !!ctx.auth.getTotpSecret(a.id) };
}

export async function requireMinRole(min: Role): Promise<Account> {
  const ctx = await getRequestContext();
  const a = ctx.auth.requireMinRole(ctx.sessionToken, ctx.meta, min);
  return { ...a, totpEnabled: !!ctx.auth.getTotpSecret(a.id) };
}

export async function requireRole(...roles: Role[]): Promise<Account> {
  const ctx = await getRequestContext();
  const a = ctx.auth.requireRole(ctx.sessionToken, ctx.meta, ...roles);
  return { ...a, totpEnabled: !!ctx.auth.getTotpSecret(a.id) };
}

export async function guardPage(min: Role): Promise<Account> {
  try {
    return await requireMinRole(min);
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.status === 401) redirect('/login');
      redirect(`/?err=${encodeURIComponent('権限がありません')}`);
    }
    throw e;
  }
}
