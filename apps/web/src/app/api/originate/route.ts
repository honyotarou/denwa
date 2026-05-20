import { buildContextFromRequest } from '@/server/request-meta';
import { rejectDisallowedPostOrigin } from '@/server/api/post-origin';
import { handleOriginatePost } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const hasBearer = /^Bearer\s+\S+/i.test(req.headers.get('authorization') ?? '');
  if (!hasBearer) {
    const denied = rejectDisallowedPostOrigin(req);
    if (denied) return Response.json(denied.body, { status: denied.status });
  }
  const ctx = buildContextFromRequest(req);
  const body = await req.json();
  const r = await handleOriginatePost(ctx, body);
  return Response.json(r.body, { status: r.status });
}
