import type { AppContext } from '../context.js';
import {
  createExtensionWithSync,
  deleteExtensionWithSync,
  updateExtensionWithSync,
} from '../services/extensions';
import { requireUser, s } from './shared.js';

export async function createExtensionActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await createExtensionWithSync(ctx, me, {
    number: s(formData.get('number')),
    displayName: s(formData.get('displayName')) || null,
    secret: s(formData.get('secret')),
    note: s(formData.get('note')) || null,
    webrtc: formData.get('webrtc') === 'on',
  });
}

export async function updateExtensionActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await updateExtensionWithSync(ctx, me, {
    number: s(formData.get('number')),
    displayName: s(formData.get('displayName')) || null,
    secret: s(formData.get('secret')),
    note: s(formData.get('note')) || null,
    webrtc: formData.get('webrtc') === 'on',
  });
}

export async function deleteExtensionActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  if (!(await deleteExtensionWithSync(ctx, me, s(formData.get('number'))))) throw new Error('not found');
}
