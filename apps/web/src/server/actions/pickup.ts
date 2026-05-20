import type { AppContext } from '../context.js';
import { requireUser, s } from './shared.js';
import { parseCommaSeparatedExtensions } from '../services/form-helpers';
import {
  createPickupGroupWithSync,
  deletePickupGroupWithSync,
  updatePickupGroupWithSync,
} from '../services/pickup';

export async function createPickupGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await createPickupGroupWithSync(
    ctx,
    me,
    s(formData.get('name')),
    parseCommaSeparatedExtensions(s(formData.get('members'))),
  );
}

export async function updatePickupGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await updatePickupGroupWithSync(
    ctx,
    me,
    s(formData.get('name')),
    parseCommaSeparatedExtensions(s(formData.get('members'))),
  );
}

export async function deletePickupGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await deletePickupGroupWithSync(ctx, me, s(formData.get('name')));
}
