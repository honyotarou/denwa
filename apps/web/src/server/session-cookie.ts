/** Session cookie contract (T-PROD-004 / T-SEC-002). */

export type SessionCookieOptions = Readonly<{
  httpOnly: true;
  sameSite: 'lax';
  path: string;
  maxAge: number;
  secure: boolean;
}>;

export function sessionCookieOptions(): SessionCookieOptions {
  const secure =
    process.env.COOKIE_SECURE === '0'
      ? false
      : process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
    secure,
  };
}
