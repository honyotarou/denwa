import { searchPhonebook } from '@openpbx/db/repos/phonebook';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { withAuth } from '../with-auth';

export async function handlePhonebookLookupGet(
  ctx: AppContext,
  q: string,
): Promise<JsonHandlerResult> {
  return withAuth(ctx, () => ({ status: 200, body: { entries: searchPhonebook(ctx.db, q) } }));
}
