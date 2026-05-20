'use server';

import { getRequestContext } from '@/lib/auth';
import { updateNetworkSettingsWithSync } from '@/server/services/network';
import { flash } from './_flash';

export async function updateNetworkAction(formData: FormData): Promise<void> {
  await flash('/network', 'ネットワーク設定を保存しました', async () => {
    const ctx = await getRequestContext();
    const me = ctx.auth.requireRole(ctx.sessionToken, ctx.meta, 'admin');
    await updateNetworkSettingsWithSync(ctx, me, {
      externalIp: String(formData.get('externalIp') ?? ''),
      externalSignalingIp: String(formData.get('externalSignalingIp') ?? ''),
      localNet: String(formData.get('localNet') ?? ''),
    });
  });
}
