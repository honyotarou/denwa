import { validateUpgradeDraft } from '@openpbx/core';
import { deleteVersionUpgrade, scheduleVersionUpgrade } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../actions/shared';
import { throwIfInvalid } from './validate';

export function scheduleUpgradeWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  input: { scheduledAt: string; asteriskImage: string },
): void {
  throwIfInvalid(validateUpgradeDraft(input));
  scheduleVersionUpgrade(ctx.db, input);
  audit(ctx, me, 'upgrade.schedule');
}

export function deleteUpgradeWithAudit(ctx: AppContext, me: SessionAccount, id: number): void {
  deleteVersionUpgrade(ctx.db, id);
  audit(ctx, me, 'upgrade.delete');
}
