import { handleHealthGet } from '@/server/api-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const r = await handleHealthGet();
  return Response.json(r.body, { status: r.status });
}
