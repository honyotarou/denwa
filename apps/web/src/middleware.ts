import { NextRequest, NextResponse } from 'next/server';
import { middlewareDecision } from '@/server/middleware-auth';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = !!req.cookies.get('cr_session')?.value;
  const ipAllowed = true;
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
