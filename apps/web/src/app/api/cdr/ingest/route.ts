import { buildContextFromRequest } from '@/server/request-meta';
import { handleCdrIngestPost } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ctx = buildContextFromRequest(req);
  const r = await handleCdrIngestPost(ctx);
  return Response.json(r.body, { status: r.status });
}
