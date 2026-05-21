import { buildContextFromRequest } from '@/server/request-meta';
import { rejectDisallowedPostOrigin } from '@/server/api/post-origin';
import {
  handleExtensionByNumberDelete,
  handleExtensionByNumberGet,
  handleExtensionByNumberPut,
} from '@/server/api/handlers/extension-by-number';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ number: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { number } = await params;
  const ctx = buildContextFromRequest(req);
  const r = await handleExtensionByNumberGet(ctx, number);
  return Response.json(r.body, { status: r.status });
}

export async function PUT(req: Request, { params }: Ctx) {
  const denied = rejectDisallowedPostOrigin(req);
  if (denied) return Response.json(denied.body, { status: denied.status });
  const { number } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  const ctx = buildContextFromRequest(req);
  const r = await handleExtensionByNumberPut(ctx, number, body);
  return Response.json(r.body, { status: r.status });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = rejectDisallowedPostOrigin(req);
  if (denied) return Response.json(denied.body, { status: denied.status });
  const { number } = await params;
  const ctx = buildContextFromRequest(req);
  const r = await handleExtensionByNumberDelete(ctx, number);
  return Response.json(r.body, { status: r.status });
}
