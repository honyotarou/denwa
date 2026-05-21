import { deleteGuidance } from '@openpbx/db';
import { deleteGuidanceWav } from '@openpbx/infra';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';

export async function deleteGuidanceWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  name: string,
): Promise<void> {
  deleteGuidance(ctx.db, name);
  await deleteGuidanceWav(ctx.infraDirs.soundsDir, name);
  audit(ctx, me, 'guidance.delete', name);
}
