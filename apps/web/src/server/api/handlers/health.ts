import type { JsonHandlerResult } from '../types';
import { checkHealth } from '../../services/health';

export async function handleHealthGet(): Promise<JsonHandlerResult> {
  const h = checkHealth();
  return { status: h.ok ? 200 : 503, body: h };
}
