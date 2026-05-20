import { validateNetworkSettingsInput } from '@openpbx/core';
import { updateNetworkSettings } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';
import { throwIfInvalid } from './validate';

export async function updateNetworkSettingsWithSync(
  ctx: AppContext,
  me: SessionAccount,
  input: { externalIp?: string; externalSignalingIp?: string; localNet?: string },
): Promise<void> {
  throwIfInvalid(validateNetworkSettingsInput(input));
  updateNetworkSettings(ctx.db, input);
  await ctx.infra.syncPjsipTransports();
  audit(ctx, me, 'network.update');
}
