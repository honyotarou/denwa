import { buildContext, sessionTokenFromCookieHeader } from '@/server/app-context';
import { handlePhonebookLookupGet } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = buildContext(sessionTokenFromCookieHeader(req.headers.get('cookie')));
  const q = new URL(req.url).searchParams.get('q') ?? '';
  const r = await handlePhonebookLookupGet(ctx, q);
  return Response.json(r.body, { status: r.status });
}
