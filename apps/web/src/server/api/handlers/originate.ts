import {
  validateOriginateRequest,
  hashClickToCallToken,
  verifyClickToCallTokenPlain,
  clickToCallFromMatchesToken,
  rateLimitKeyForBearerToken,
  type OriginateRequest,
} from '@openpbx/core';
import { findActiveClickToCallTokenByHash } from '@openpbx/db/repos/click-to-call-tokens';
import { getAccountById } from '@openpbx/db/repos/accounts';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { withAuth } from '../with-auth';
import { executeOriginateCall } from '../../services/originate-call';
import { rejectIfAppRateLimited } from '../../services/app-rate-limit';

function parseOriginateBody(body: Record<string, unknown>): OriginateRequest {
  return {
    from: String(body.from ?? ''),
    to: String(body.to ?? ''),
    callerId: body.callerId != null ? String(body.callerId) : undefined,
    context: body.context != null ? String(body.context) : undefined,
  };
}

/** T-CHX-013〜015: Bearer token（Chrome 拡張） */
async function handleOriginateBearer(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<JsonHandlerResult> {
  const plain = ctx.bearerToken?.trim();
  if (!plain) return { status: 401, body: { error: 'unauthorized' } };

  const limited = rejectIfAppRateLimited(
    ctx,
    'originate-bearer',
    rateLimitKeyForBearerToken(plain, hashClickToCallToken),
  );
  if (limited) return limited;

  const req = parseOriginateBody(body);
  const errs = validateOriginateRequest(req);
  if (errs.length) return { status: 400, body: { error: errs.join('; ') } };

  const hash = hashClickToCallToken(plain);
  const tok = findActiveClickToCallTokenByHash(ctx.db, hash);
  if (!tok || !verifyClickToCallTokenPlain(plain, tok.tokenHash)) {
    return { status: 401, body: { error: 'invalid token' } };
  }
  if (!clickToCallFromMatchesToken(req.from, tok.fromExtension)) {
    return { status: 403, body: { error: 'from extension not allowed for token' } };
  }

  const acct = getAccountById(ctx.db, tok.accountId);
  if (!acct) return { status: 401, body: { error: 'unauthorized' } };

  return executeOriginateCall(ctx, req, `click2call:${tok.name}`);
}

/** T-API-009: セッション + user+ */
async function handleOriginateSession(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<JsonHandlerResult> {
  return withAuth(ctx, async (me) => {
    const req = parseOriginateBody(body);
    const errs = validateOriginateRequest(req);
    if (errs.length) return { status: 400, body: { error: errs.join('; ') } };
    return executeOriginateCall(ctx, req, me.username);
  });
}

export async function handleOriginatePost(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<JsonHandlerResult> {
  if (ctx.bearerToken) return handleOriginateBearer(ctx, body);
  return handleOriginateSession(ctx, body);
}
