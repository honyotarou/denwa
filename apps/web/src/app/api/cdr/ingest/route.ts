import { buildContextFromRequest } from '@/server/request-meta';
import { rejectDisallowedPostOrigin } from '@/server/api/post-origin';
import { handleCdrIngestPost } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const denied = rejectDisallowedPostOrigin(req);
  if (denied) return Response.json(denied.body, { status: denied.status });
  const ctx = buildContextFromRequest(req);
  const r = await handleCdrIngestPost(ctx);
  return Response.json(r.body, { status: r.status });
}
