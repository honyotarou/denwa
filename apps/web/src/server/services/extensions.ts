import { normalizeExtensionDraft, resolveSecretOnUpdate, validateExtensionDraft, toExtensionDraft } from '@openpbx/core';
import {
  createExtension,
  deleteExtension,
  getExtension,
  updateExtension,
  type UpsertExtensionInput,
} from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';
import { throwIfInvalid } from './validate';

function resolveExtensionSecret(
  db: AppContext['db'],
  number: string,
  inputSecret: string | null | undefined,
): string {
  const existing = getExtension(db, number)?.secret;
  return resolveSecretOnUpdate(inputSecret, existing);
}

function extensionDraftFromInput(input: UpsertExtensionInput) {
  const normalized = normalizeExtensionDraft({
    number: input.number,
    displayName: input.displayName,
    secret: input.secret,
    webrtc: input.webrtc,
  });
  throwIfInvalid(validateExtensionDraft(normalized));
  return toExtensionDraft(normalized);
}

export async function createExtensionWithSync(
  ctx: AppContext,
  me: SessionAccount,
  input: UpsertExtensionInput,
): Promise<void> {
  const draft = extensionDraftFromInput(input);
  createExtension(ctx.db, { ...input, number: draft.number, webrtc: draft.webrtc });
  await ctx.infra.syncPjsipExtensions();
  audit(ctx, me, 'extension.create', draft.number);
}

export async function updateExtensionWithSync(
  ctx: AppContext,
  me: SessionAccount,
  input: UpsertExtensionInput,
): Promise<void> {
  const secret = resolveExtensionSecret(ctx.db, input.number, input.secret);
  const draft = extensionDraftFromInput({ ...input, secret });
  updateExtension(ctx.db, { ...input, secret, number: draft.number, webrtc: draft.webrtc });
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
