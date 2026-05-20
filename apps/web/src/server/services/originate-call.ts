import type { OriginateRequest } from '@openpbx/core';
import { isAmiOriginateError } from '@openpbx/infra';
import type { AppContext } from '../context';
import type { JsonHandlerResult } from '../api/types';

function auditOriginate(ctx: AppContext, actor: string, from: string, to: string): void {
  ctx.auth.recordAudit({
    actor,
    action: 'click2call',
    target: `${from}->${to}`,
    ip: ctx.meta.ip,
    userAgent: ctx.meta.userAgent,
  });
}

function amiErrorStatus(e: unknown): JsonHandlerResult {
  if (isAmiOriginateError(e)) {
    const status = e.code === 'TIMEOUT' ? 504 : 502;
    return { status, body: { error: e.message } };
  }
  const msg = e instanceof Error ? e.message : 'originate failed';
  return { status: 502, body: { error: msg } };
}

/** T-API-009: 検証済みリクエストを AMI へ（監査は成功時のみ） */
export async function executeOriginateCall(
  ctx: AppContext,
  req: OriginateRequest,
  actor: string,
): Promise<JsonHandlerResult> {
  try {
    const result = await ctx.ami.originate(req);
    auditOriginate(ctx, actor, req.from, req.to);
    return { status: 200, body: { ok: result.ok } };
  } catch (e) {
    return amiErrorStatus(e);
  }
}
