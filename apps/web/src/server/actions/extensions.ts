import type { AppContext } from '../context.js';
import {
  createExtensionWithSync,
  deleteExtensionWithSync,
  updateExtensionWithSync,
} from '../services/extensions';
import { parseExtensionForm } from './forms/extension-form';
import { requireUser, s } from './shared.js';

export async function createExtensionActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await createExtensionWithSync(ctx, me, parseExtensionForm(formData));
}

export async function updateExtensionActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await updateExtensionWithSync(ctx, me, parseExtensionForm(formData));
}

export async function deleteExtensionActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  if (!(await deleteExtensionWithSync(ctx, me, s(formData.get('number'))))) throw new Error('not found');
}
