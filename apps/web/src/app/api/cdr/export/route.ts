import { buildContextFromRequest } from '@/server/request-meta';
import { handleCdrExportGet } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = buildContextFromRequest(req);
  const r = await handleCdrExportGet(ctx);
  if (typeof r.body === 'string') {
    return new Response(r.body, { status: r.status, headers: r.headers });
  }
  return Response.json(r.body, { status: r.status });
}
