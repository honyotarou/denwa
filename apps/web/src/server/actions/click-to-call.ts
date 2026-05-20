import type { AppContext } from '../context.js';
import { s } from './shared.js';
import {
  createMyClickToCallToken,
  revokeMyClickToCallToken,
} from '../services/click-to-call.js';

export async function createClickToCallTokenActionImpl(
  ctx: AppContext,
  formData: FormData,
): Promise<{ plain: string }> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  const { plain } = createMyClickToCallToken(ctx, me, {
    name: s(formData.get('name')),
    fromExtension: s(formData.get('fromExtension')),
  });
  return { plain };
}

export async function revokeClickToCallTokenActionImpl(
  ctx: AppContext,
  formData: FormData,
): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  revokeMyClickToCallToken(ctx, me, Number(s(formData.get('id'))));
}
