import { normalizeTrunkDraft, validateTrunkDraft, type TrunkDraftInput } from '@openpbx/core';
import { deleteSipTrunk, listSipTrunks, upsertSipTrunk } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';
import { throwIfInvalid } from './validate';

function trunkDraftFromInput(input: TrunkDraftInput) {
  const draft = normalizeTrunkDraft(input);
  throwIfInvalid(validateTrunkDraft(draft));
  return draft;
}

function resolveTrunkSecret(
  db: AppContext['db'],
  name: string,
  inputSecret: string | null | undefined,
): string | null {
  const trimmed = inputSecret?.trim();
  if (trimmed) return trimmed;
  const existing = listSipTrunks(db).find((t) => t.name === name);
  return existing?.secret ?? null;
}

export async function upsertTrunkWithSync(
  ctx: AppContext,
  me: SessionAccount,
  input: TrunkDraftInput & { note?: string | null },
): Promise<void> {
  const draft = trunkDraftFromInput(input);
  upsertSipTrunk(ctx.db, {
    name: draft.name,
    host: draft.host,
    port: draft.port,
    username: draft.username,
    secret: resolveTrunkSecret(ctx.db, draft.name, input.secret),
    registration: draft.registration,
    fromUser: draft.fromUser,
    fromDomain: draft.fromDomain,
    didInbound: draft.didInbound,
    outboundPrefix: draft.outboundPrefix,
    note: input.note?.trim() ? input.note.trim() : null,
  });
  await ctx.infra.syncTrunks();
  audit(ctx, me, 'trunk.upsert', draft.name);
}

export async function deleteTrunkWithSync(
  ctx: AppContext,
  me: SessionAccount,
  name: string,
): Promise<void> {
  if (!deleteSipTrunk(ctx.db, name)) throw new Error('not found');
  await ctx.infra.syncTrunks();
  audit(ctx, me, 'trunk.delete', name);
}
