import { normalizeExtensionDraft, validateExtensionDraft } from '@openpbx/core';
import {
  createExtension,
  deleteExtension,
  updateExtension,
  type UpsertExtensionInput,
} from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../actions/shared';
import { throwIfInvalid } from './validate';

export async function createExtensionWithSync(
  ctx: AppContext,
  me: SessionAccount,
  input: UpsertExtensionInput,
): Promise<void> {
  const draft = normalizeExtensionDraft({
    number: input.number,
    displayName: input.displayName,
    secret: input.secret,
    webrtc: input.webrtc,
  });
  throwIfInvalid(validateExtensionDraft(draft));
  createExtension(ctx.db, { ...input, ...draft });
  await ctx.infra.syncPjsipExtensions();
  audit(ctx, me, 'extension.create', draft.number);
}

export async function updateExtensionWithSync(
  ctx: AppContext,
  me: SessionAccount,
  input: UpsertExtensionInput,
): Promise<void> {
  const draft = normalizeExtensionDraft({
    number: input.number,
    displayName: input.displayName,
    secret: input.secret,
    webrtc: input.webrtc,
  });
  throwIfInvalid(validateExtensionDraft(draft));
  updateExtension(ctx.db, { ...input, ...draft });
  await ctx.infra.syncPjsipExtensions();
  audit(ctx, me, 'extension.update', draft.number);
}

export async function deleteExtensionWithSync(
  ctx: AppContext,
  me: SessionAccount,
  number: string,
): Promise<boolean> {
  const ok = deleteExtension(ctx.db, number);
  if (ok) await ctx.infra.syncPjsipExtensions();
  if (ok) audit(ctx, me, 'extension.delete', number);
  return ok;
}
