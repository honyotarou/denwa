import { listExtensions } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';

export type SoftphoneProfile = Readonly<{
  number: string;
  secret?: string;
}>;

/** T-SOFT-001/002: admin のみ secret 付き。user/supervisor は空（grant 未実装） */
export function getSoftphoneProfiles(ctx: AppContext, me: SessionAccount): SoftphoneProfile[] {
  const webrtc = listExtensions(ctx.db).filter((e) => e.webrtc);
  if (me.role !== 'admin') return [];
  return webrtc.map((e) => ({ number: e.number, secret: e.secret }));
}
