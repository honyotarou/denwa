import type { RingStrategy } from '@openpbx/core';
import type { AppContext } from '../context.js';
import { requireUser, s } from './shared.js';
import { parseCommaSeparatedExtensions } from '../services/form-helpers';
import {
  createRingGroupWithSync,
  deleteRingGroupWithSync,
  updateRingGroupWithSync,
} from '../services/ring-groups';

export async function createRingGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await createRingGroupWithSync(ctx, me, {
    number: s(formData.get('number')),
    name: s(formData.get('name')) || null,
    strategy: (s(formData.get('strategy')) || 'ringall') as RingStrategy,
    ringSeconds: Number(s(formData.get('ringSeconds')) || '30'),
    members: parseCommaSeparatedExtensions(s(formData.get('members'))),
  });
}

export async function updateRingGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await updateRingGroupWithSync(
    ctx,
    me,
    s(formData.get('number')),
    parseCommaSeparatedExtensions(s(formData.get('members'))),
  );
}

export async function deleteRingGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await deleteRingGroupWithSync(ctx, me, s(formData.get('number')));
}
