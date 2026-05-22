import { extensionForRole, PBX_CONFIG_WRITE_MIN_ROLE } from '@openpbx/core';
import { getExtension } from '@openpbx/db/repos/extensions';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { withAuth } from '../with-auth';
import {
  deleteExtensionWithSync,
  updateExtensionWithSync,
} from '../../services/extensions';

export async function handleExtensionByNumberGet(
  ctx: AppContext,
  number: string,
): Promise<JsonHandlerResult> {
  return withAuth(ctx, (me) => {
    const ext = getExtension(ctx.db, number);
    if (!ext) return { status: 404, body: { error: 'not found' } };
    return {
      status: 200,
      body: {
        extension: extensionForRole(ext, me.role),
      },
    };
  });
}

export async function handleExtensionByNumberPut(
  ctx: AppContext,
  number: string,
  body: Record<string, unknown>,
): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    async (me) => {
      if (!getExtension(ctx.db, number)) {
        return { status: 404, body: { error: 'not found' } };
      }
      try {
        await updateExtensionWithSync(ctx, me, {
          number,
          secret: String(body.secret ?? ''),
          displayName: typeof body.displayName === 'string' ? body.displayName : null,
          webrtc: body.webrtc === true,
          note: typeof body.note === 'string' ? body.note : null,
        });
        return { status: 200, body: { ok: true } };
      } catch (e) {
        return { status: 400, body: { error: e instanceof Error ? e.message : 'invalid' } };
      }
    },
    { minRole: PBX_CONFIG_WRITE_MIN_ROLE },
  );
}

export async function handleExtensionByNumberDelete(
  ctx: AppContext,
  number: string,
): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    async (me) => {
      const ok = await deleteExtensionWithSync(ctx, me, number);
      if (!ok) return { status: 404, body: { error: 'not found' } };
      return { status: 200, body: { ok: true } };
    },
    { minRole: PBX_CONFIG_WRITE_MIN_ROLE },
  );
}
