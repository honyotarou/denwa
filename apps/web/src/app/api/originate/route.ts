import { buildContext, sessionTokenFromCookieHeader } from '@/server/app-context';
import { handleOriginatePost } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ctx = buildContext(sessionTokenFromCookieHeader(req.headers.get('cookie')));
  const body = await req.json();
  const r = await handleOriginatePost(ctx, body);
  return Response.json(r.body, { status: r.status });
}
