import { buildContextFromRequest } from '@/server/request-meta';
import { handleInboxWavGet } from '@/server/api-handlers';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ file: string }> },
): Promise<Response> {
  const { file } = await ctx.params;
  const appCtx = await buildContextFromRequest(req);
  const r = await handleInboxWavGet(appCtx, decodeURIComponent(file));
  if (r.stream) {
    return new Response(r.stream as ReadableStream, { status: 200 });
  }
  return Response.json(r.body ?? {}, { status: r.status });
}
