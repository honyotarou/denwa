import type { RingStrategy } from '@openpbx/core';
import type { AppContext } from '../context.js';
import { requirePbxConfigWrite, s } from './shared.js';
import { parseCommaSeparatedExtensions } from '../services/form-helpers';
import {
  createRingGroupWithSync,
  deleteRingGroupWithSync,
  updateRingGroupWithSync,
} from '../services/ring-groups';

function fallbackFromForm(formData: FormData): string | null {
  const v = s(formData.get('fallbackExtension'));
  return v || null;
}

export async function createRingGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requirePbxConfigWrite(ctx);
  await createRingGroupWithSync(ctx, me, {
    number: s(formData.get('number')),
    name: s(formData.get('name')) || null,
    strategy: (s(formData.get('strategy')) || 'ringall') as RingStrategy,
    ringSeconds: Number(s(formData.get('ringSeconds')) || '30'),
    fallbackExtension: fallbackFromForm(formData),
    members: parseCommaSeparatedExtensions(s(formData.get('members'))),
  });
}

export async function updateRingGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requirePbxConfigWrite(ctx);
  const number = s(formData.get('number'));
  const membersRaw = s(formData.get('members'));
  await updateRingGroupWithSync(ctx, me, number, {
    members: membersRaw ? parseCommaSeparatedExtensions(membersRaw) : undefined,
    name: formData.has('name') ? s(formData.get('name')) || null : undefined,
    strategy: formData.has('strategy')
      ? ((s(formData.get('strategy')) || 'ringall') as RingStrategy)
      : undefined,
    ringSeconds: formData.has('ringSeconds') ? Number(s(formData.get('ringSeconds')) || '30') : undefined,
    fallbackExtension: formData.has('fallbackExtension') ? fallbackFromForm(formData) : undefined,
  });
}

export async function deleteRingGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requirePbxConfigWrite(ctx);
  await deleteRingGroupWithSync(ctx, me, s(formData.get('number')));
}
