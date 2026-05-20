import { NextRequest, NextResponse } from 'next/server';
import { middlewareDecision } from '@/server/middleware-auth';
import { resolveMiddlewareIpAllowed } from '@/server/middleware-ip';

function clientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim();
  return req.headers.get('x-real-ip') ?? undefined;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = !!req.cookies.get('cr_session')?.value;
  const ipAllowed = resolveMiddlewareIpAllowed(clientIp(req));
  const decision = middlewareDecision({ pathname, hasSession, ipAllowed });
  if (decision.kind === 'next') return NextResponse.next();
  if (decision.kind === 'json') {
    return NextResponse.json(decision.body, { status: decision.status });
  }
  const url = req.nextUrl.clone();
  url.pathname = decision.pathname;
  url.search = decision.search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
