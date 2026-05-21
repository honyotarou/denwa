import { NextResponse } from 'next/server';
import { buildContextFromRequest } from '@/server/request-meta';
import { rejectDisallowedPostOrigin } from '@/server/api/post-origin';
import { handlePatientRecordsPost } from '@/server/api/handlers/patient-records';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const denied = rejectDisallowedPostOrigin(req);
  if (denied) return NextResponse.json(denied.body, { status: denied.status });
  const ctx = buildContextFromRequest(req);
  const ct = req.headers.get('content-type') ?? '';
  let body: Record<string, unknown>;
  if (ct.includes('application/json')) {
    body = (await req.json()) as Record<string, unknown>;
  } else {
    const form = await req.formData();
    body = Object.fromEntries(form.entries());
  }
  const result = await handlePatientRecordsPost(ctx, body);
  return NextResponse.json(result.body, { status: result.status });
}
