import { buildContext, sessionTokenFromCookieHeader } from '@/server/app-context';
import { handleCdrIngestPost } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ctx = buildContext(sessionTokenFromCookieHeader(req.headers.get('cookie')));
  const r = await handleCdrIngestPost(ctx);
  return Response.json(r.body, { status: r.status });
}
