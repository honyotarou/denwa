import { NextRequest, NextResponse } from 'next/server';
import { wssConnectHostsForRequestHost } from '@openpbx/core/prod/content-security-policy';
import { middlewareDecision } from '@/server/middleware-auth';
import { resolveMiddlewareIpAllowed } from '@/server/middleware-ip';
import { clientIpForMiddleware } from '@/server/request-ip';
import { buildSecurityHeaders } from '@/server/security-headers';

function buildNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function applySecurityHeaders(res: NextResponse, req: NextRequest): void {
  const nonce = buildNonce();
  const host = req.headers.get('host') ?? undefined;
  const isProduction = process.env.NODE_ENV === 'production';
  const headers = buildSecurityHeaders(isProduction, {
    scriptNonce: nonce,
    wssConnectHosts: wssConnectHostsForRequestHost(host),
  });
  for (const [key, value] of Object.entries(headers)) {
    res.headers.set(key, value);
  }
  res.headers.set('x-nonce', nonce);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = !!req.cookies.get('cr_session')?.value;
  const ipAllowed = resolveMiddlewareIpAllowed(clientIpForMiddleware(req.headers));
  const decision = middlewareDecision({ pathname, hasSession, ipAllowed });
  if (decision.kind === 'next') {
    const res = NextResponse.next();
    applySecurityHeaders(res, req);
    return res;
  }
  if (decision.kind === 'json') {
    const res = NextResponse.json(decision.body, { status: decision.status });
    applySecurityHeaders(res, req);
    return res;
  }
  const url = req.nextUrl.clone();
  url.pathname = decision.pathname;
  url.search = decision.search;
  const res = NextResponse.redirect(url);
  applySecurityHeaders(res, req);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
