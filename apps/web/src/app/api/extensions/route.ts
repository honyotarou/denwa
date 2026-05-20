import { buildContextFromRequest } from '@/server/request-meta';
import { handleExtensionsGet, handleExtensionsPost } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = buildContextFromRequest(req);
  const r = await handleExtensionsGet(ctx);
  return Response.json(r.body, { status: r.status });
}

export async function POST(req: Request) {
  const ctx = buildContextFromRequest(req);
  const body = await req.json();
  const r = await handleExtensionsPost(ctx, body);
  return Response.json(r.body, { status: r.status });
}
