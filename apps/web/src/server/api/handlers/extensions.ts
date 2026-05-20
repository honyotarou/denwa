import { DuplicateError } from '@openpbx/db/errors';
import { listExtensions } from '@openpbx/db/repos/extensions';
import { maskSecret } from '@/lib/format';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { withAuth } from '../with-auth';
import { createExtensionWithSync } from '../../services/extensions';

export async function handleExtensionsGet(ctx: AppContext): Promise<JsonHandlerResult> {
  return withAuth(ctx, (me) => {
    const extensions = listExtensions(ctx.db).map((e) => ({
      ...e,
      secret: maskSecret(me.role, e.secret),
    }));
    return { status: 200, body: { extensions } };
  });
}

export async function handleExtensionsPost(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    async (me) => {
      try {
        await createExtensionWithSync(ctx, me, {
          number: String(body.number ?? ''),
          secret: String(body.secret ?? ''),
          displayName: typeof body.displayName === 'string' ? body.displayName : null,
          webrtc: body.webrtc === true,
          note: null,
        });
        return { status: 201, body: { ok: true } };
      } catch (e) {
        if (e instanceof DuplicateError) return { status: 400, body: { error: e.message } };
        if (e instanceof Error) return { status: 400, body: { error: e.message } };
        throw e;
      }
    },
    { minRole: 'user' },
  );
}
