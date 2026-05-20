import { buildContext, sessionTokenFromCookieHeader } from '@/server/app-context';
import { handleDevicesStreamGet } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = buildContext(sessionTokenFromCookieHeader(req.headers.get('cookie')));
  const r = await handleDevicesStreamGet(ctx);
  return new Response(r.stream, { status: r.status, headers: r.headers });
}
