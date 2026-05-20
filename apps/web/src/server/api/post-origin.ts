import { isAllowedPostOrigin } from '@openpbx/core';
import type { JsonHandlerResult } from './types';

/** POST API の CSRF（Origin）— 単一正本は @openpbx/core/http/csrf */
export function rejectDisallowedPostOrigin(req: Request): JsonHandlerResult | null {
  const host = req.headers.get('host') ?? '';
  const origin = req.headers.get('origin');
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (!isAllowedPostOrigin(origin, host, secFetchSite)) {
    return { status: 403, body: { error: 'origin not allowed' } };
  }
  return null;
}
