const PUBLIC_PATHS = ['/login', '/api/login', '/api/logout', '/api/health'];

export type MiddlewareDecision =
  | { kind: 'next' }
  | { kind: 'redirect'; pathname: string; search: string }
  | { kind: 'json'; status: number; body: unknown };

/** T-MW-001〜006 の純関数（Edge middleware / テスト共用） */
export function middlewareDecision(input: {
  pathname: string;
  hasSession: boolean;
  ipAllowed: boolean;
}): MiddlewareDecision {
  const { pathname, hasSession, ipAllowed } = input;
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return { kind: 'next' };
  }
  if (!hasSession) {
    if (pathname.startsWith('/api/')) {
      return { kind: 'json', status: 401, body: { error: 'unauthorized' } };
    }
    return {
      kind: 'redirect',
      pathname: '/login',
      search: `?next=${encodeURIComponent(pathname)}`,
    };
  }
  if (!ipAllowed) {
    return { kind: 'json', status: 403, body: { error: 'forbidden' } };
  }
  return { kind: 'next' };
}
