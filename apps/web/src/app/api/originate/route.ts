import { buildContextFromRequest } from '@/server/request-meta';
import { handleOriginatePost } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ctx = buildContextFromRequest(req);
  const body = await req.json();
  const r = await handleOriginatePost(ctx, body);
  return Response.json(r.body, { status: r.status });
}
