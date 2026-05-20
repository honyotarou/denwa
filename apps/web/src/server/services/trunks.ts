import { validateTrunkDraft, type TrunkDraft } from '@openpbx/core';
import { deleteSipTrunk, upsertSipTrunk } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../actions/shared';
import { throwIfInvalid } from './validate';

function trunkDraftFromForm(input: { name: string; host: string; port?: number }): TrunkDraft {
  return {
    name: input.name,
    host: input.host,
    port: input.port ?? 5060,
    username: null,
    secret: null,
    registration: false,
    fromUser: null,
    fromDomain: null,
    didInbound: null,
    outboundPrefix: null,
  };
}

export async function upsertTrunkWithSync(
  ctx: AppContext,
  me: SessionAccount,
  input: { name: string; host: string; port?: number },
): Promise<void> {
  const draft = trunkDraftFromForm(input);
  throwIfInvalid(validateTrunkDraft(draft));
  upsertSipTrunk(ctx.db, { name: draft.name, host: draft.host, port: draft.port });
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
