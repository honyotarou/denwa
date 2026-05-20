import { buildContextFromRequest } from '@/server/request-meta';
import { handleRecordingGet } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const ctx = buildContextFromRequest(req);
  const r = await handleRecordingGet(ctx, decodeURIComponent(file));
  if (r.stream) {
    return new Response(r.stream as unknown as ReadableStream, {
      status: r.status,
      headers: { 'Content-Type': 'audio/wav' },
    });
  }
  return Response.json(r.body, { status: r.status });
}
