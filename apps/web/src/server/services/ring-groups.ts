import { validateRingGroupDraft, type RingGroupDraft, type RingStrategy } from '@openpbx/core';
import { createRingGroup, deleteRingGroup, getRingGroup, updateRingGroup } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';
import { throwIfInvalid } from './validate';

export async function createRingGroupWithSync(
  ctx: AppContext,
  me: SessionAccount,
  input: {
    number: string;
    name: string | null;
    strategy: RingStrategy;
    ringSeconds: number;
    fallbackExtension: string | null;
    members: readonly string[];
  },
): Promise<void> {
  const draft: RingGroupDraft = {
    number: input.number,
    name: input.name,
    strategy: input.strategy,
    ringSeconds: input.ringSeconds,
    fallbackExtension: input.fallbackExtension,
    members: input.members,
  };
  throwIfInvalid(validateRingGroupDraft(draft));
  createRingGroup(ctx.db, {
    number: draft.number,
    name: draft.name,
    strategy: draft.strategy,
    ringSeconds: draft.ringSeconds,
    fallbackExtension: draft.fallbackExtension,
    members: draft.members,
  });
  await ctx.infra.syncRingGroups();
  audit(ctx, me, 'ring_group.create', draft.number);
}

export async function updateRingGroupWithSync(
  ctx: AppContext,
  me: SessionAccount,
  number: string,
  patch: {
    members?: readonly string[];
    name?: string | null;
    strategy?: RingStrategy;
    ringSeconds?: number;
    fallbackExtension?: string | null;
  },
): Promise<void> {
  const existing = getRingGroup(ctx.db, number);
  if (!existing) throw new Error('not found');
  const draft: RingGroupDraft = {
    number: existing.number,
    name: patch.name !== undefined ? patch.name : existing.name,
    strategy: (patch.strategy ?? existing.strategy) as RingStrategy,
    ringSeconds: patch.ringSeconds ?? existing.ringSeconds,
    fallbackExtension:
      patch.fallbackExtension !== undefined ? patch.fallbackExtension : existing.fallbackExtension,
    members: patch.members ?? existing.members,
  };
  throwIfInvalid(validateRingGroupDraft(draft));
  updateRingGroup(ctx.db, {
    number,
    name: draft.name,
    strategy: draft.strategy,
    ringSeconds: draft.ringSeconds,
    fallbackExtension: draft.fallbackExtension,
    members: draft.members,
  });
  await ctx.infra.syncRingGroups();
  audit(ctx, me, 'ring_group.update', number);
}

export async function deleteRingGroupWithSync(
  ctx: AppContext,
  me: SessionAccount,
  number: string,
): Promise<void> {
  if (!deleteRingGroup(ctx.db, number)) throw new Error('not found');
  await ctx.infra.syncRingGroups();
  audit(ctx, me, 'ring_group.delete', number);
}
