import type { JsonHandlerResult } from '../types';

export async function handleHealthGet(): Promise<JsonHandlerResult> {
  return { status: 200, body: { ok: true } };
}
