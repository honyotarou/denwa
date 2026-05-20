import { validateOriginateRequest } from '@openpbx/core';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { withAuth } from '../with-auth';

export async function handleOriginatePost(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<JsonHandlerResult> {
  return withAuth(ctx, (me) => {
    const req = { from: String(body.from ?? ''), to: String(body.to ?? '') };
    const errs = validateOriginateRequest(req);
    if (errs.length) return { status: 400, body: { error: errs.join('; ') } };
    ctx.auth.recordAudit({
      actor: me.username,
      action: 'click2call',
      target: `${req.from}->${req.to}`,
      ip: ctx.meta.ip,
      userAgent: ctx.meta.userAgent,
    });
    return { status: 200, body: { ok: true, mocked: true } };
  });
}
