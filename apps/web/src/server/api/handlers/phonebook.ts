import { searchPhonebook } from '@openpbx/db/repos/phonebook';
import { rateLimitKeyForSessionToken } from '@openpbx/core';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { audit } from '../../audit';
import { rejectIfAppRateLimited } from '../../services/app-rate-limit';
import { withAuth } from '../with-auth';

export async function handlePhonebookLookupGet(
  ctx: AppContext,
  q: string,
): Promise<JsonHandlerResult> {
  return withAuth(ctx, (me) => {
    const limited = rejectIfAppRateLimited(
      ctx,
      'phonebook-lookup',
      rateLimitKeyForSessionToken(ctx.sessionToken),
    );
    if (limited) return limited;
    audit(ctx, me, 'phonebook.lookup', q.slice(0, 64));
    return { status: 200, body: { entries: searchPhonebook(ctx.db, q) } };
  });
}
