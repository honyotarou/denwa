import { buildContextFromRequest } from '@/server/request-meta';
import { rejectDisallowedPostOrigin } from '@/server/api/post-origin';
import { handleGuidancesPost } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const denied = rejectDisallowedPostOrigin(req);
  if (denied) return Response.json(denied.body, { status: denied.status });
  const ctx = buildContextFromRequest(req);
  const form = await req.formData();
  const name = String(form.get('name') ?? '').trim();
  const file = form.get('file');
  if (!name || !(file instanceof File)) {
    return Response.json({ error: 'name and file required' }, { status: 400 });
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  const r = await handleGuidancesPost(ctx, name, buf);
  return Response.json(r.body, { status: r.status });
}
