import { parseBearerAuthorization } from '@openpbx/core';
import { buildContext, sessionTokenFromCookieHeader } from './app-context';
import { clientIpFromHeaders } from './request-ip';
import type { AppContext } from './context';

export { clientIpForMiddleware, clientIpFromHeaders, clientIpOptional } from './request-ip';

export function buildContextFromRequest(req: Request): AppContext {
  const token = sessionTokenFromCookieHeader(req.headers.get('cookie'));
  const bearerToken = parseBearerAuthorization(req.headers.get('authorization'));
  return {
    ...buildContext(token, { ip: clientIpFromHeaders(req.headers) }),
    bearerToken,
  };
}
