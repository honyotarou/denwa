import { buildContext, sessionTokenFromCookieHeader } from '@/server/app-context';
import { handleGuidancesPost } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ctx = buildContext(sessionTokenFromCookieHeader(req.headers.get('cookie')));
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
