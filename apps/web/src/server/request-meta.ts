import { buildContext, sessionTokenFromCookieHeader } from './app-context';
import { clientIpFromHeaders } from './request-ip';
import type { AppContext } from './context';

export { clientIpFromHeaders, clientIpOptional } from './request-ip';

export function buildContextFromRequest(req: Request): AppContext {
  const token = sessionTokenFromCookieHeader(req.headers.get('cookie'));
  return buildContext(token, { ip: clientIpFromHeaders(req.headers) });
}
