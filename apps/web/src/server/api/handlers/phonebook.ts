import { searchPhonebook } from '@openpbx/db/repos/phonebook';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { audit } from '../../audit';
import { withAuth } from '../with-auth';

export async function handlePhonebookLookupGet(
  ctx: AppContext,
  q: string,
): Promise<JsonHandlerResult> {
  return withAuth(ctx, (me) => {
    audit(ctx, me, 'phonebook.lookup', q.slice(0, 64));
    return { status: 200, body: { entries: searchPhonebook(ctx.db, q) } };
  });
}
