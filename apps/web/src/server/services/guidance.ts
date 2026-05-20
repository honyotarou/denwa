import { deleteGuidance } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';

export function deleteGuidanceWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  name: string,
): void {
  deleteGuidance(ctx.db, name);
  audit(ctx, me, 'guidance.delete', name);
}
