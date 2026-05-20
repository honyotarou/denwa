import {
  validateOriginateRequest,
  hashClickToCallToken,
  verifyClickToCallTokenPlain,
  clickToCallFromMatchesToken,
} from '@openpbx/core';
import { findActiveClickToCallTokenByHash } from '@openpbx/db/repos/click-to-call-tokens';
import { getAccountById } from '@openpbx/db/repos/accounts';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { withAuth } from '../with-auth';

function parseOriginateBody(body: Record<string, unknown>) {
  return {
    from: String(body.from ?? ''),
    to: String(body.to ?? ''),
    callerId: body.callerId != null ? String(body.callerId) : undefined,
    context: body.context != null ? String(body.context) : undefined,
  };
}

function recordOriginateAudit(
  ctx: AppContext,
  actor: string,
  from: string,
  to: string,
): void {
  ctx.auth.recordAudit({
    actor,
    action: 'click2call',
    target: `${from}->${to}`,
    ip: ctx.meta.ip,
    userAgent: ctx.meta.userAgent,
  });
}

/** T-CHX-013〜015: Bearer token（Chrome 拡張） */
async function handleOriginateBearer(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<JsonHandlerResult> {
  const plain = ctx.bearerToken?.trim();
  if (!plain) return { status: 401, body: { error: 'unauthorized' } };

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

  recordOriginateAudit(ctx, `click2call:${tok.name}`, req.from, req.to);
  return { status: 200, body: { ok: true, mocked: true } };
}

/** T-API-009: セッション + user+ */
async function handleOriginateSession(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    (me) => {
      const req = parseOriginateBody(body);
      const errs = validateOriginateRequest(req);
      if (errs.length) return { status: 400, body: { error: errs.join('; ') } };
      recordOriginateAudit(ctx, me.username, req.from, req.to);
      return { status: 200, body: { ok: true, mocked: true } };
    },
    {},
  );
}

export async function handleOriginatePost(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<JsonHandlerResult> {
  if (ctx.bearerToken) return handleOriginateBearer(ctx, body);
  return handleOriginateSession(ctx, body);
}
