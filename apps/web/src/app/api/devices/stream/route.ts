import { buildContextFromRequest } from '@/server/request-meta';
import { handleDevicesStreamGet } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = buildContextFromRequest(req);
  const r = await handleDevicesStreamGet(ctx);
  if (r.stream) {
    return new Response(r.stream as BodyInit, { status: r.status, headers: r.headers });
  }
  return Response.json(r.body, { status: r.status });
}
