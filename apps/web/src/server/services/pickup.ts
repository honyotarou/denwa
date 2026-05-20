import { validatePickupGroupDraft } from '@openpbx/core';
import { createPickupGroup, deletePickupGroup, updatePickupGroup } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';
import { throwIfInvalid } from './validate';

export async function createPickupGroupWithSync(
  ctx: AppContext,
  me: SessionAccount,
  name: string,
  members: readonly string[],
): Promise<void> {
  const draft = { name, members };
  throwIfInvalid(validatePickupGroupDraft(draft));
  createPickupGroup(ctx.db, name, [...members]);
  await ctx.infra.syncPickup();
  await ctx.infra.syncPjsipExtensions();
  audit(ctx, me, 'pickup.create', name);
}

export async function updatePickupGroupWithSync(
  ctx: AppContext,
  me: SessionAccount,
  name: string,
  members: readonly string[],
): Promise<void> {
  const draft = { name, members };
  throwIfInvalid(validatePickupGroupDraft(draft));
  updatePickupGroup(ctx.db, name, [...members]);
  await ctx.infra.syncPickup();
  audit(ctx, me, 'pickup.update', name);
}

export async function deletePickupGroupWithSync(
  ctx: AppContext,
  me: SessionAccount,
  name: string,
): Promise<void> {
  deletePickupGroup(ctx.db, name);
  await ctx.infra.syncPickup();
  audit(ctx, me, 'pickup.delete', name);
}
