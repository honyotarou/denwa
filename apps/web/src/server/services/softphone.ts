import { filterSoftphoneProfiles } from '@openpbx/core';
import { listExtensions, listGrantedExtensionNumbers } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';

export type SoftphoneProfile = Readonly<{
  number: string;
  secret?: string;
}>;

/** T-SOFT-001〜003: admin は全 WebRTC、user/supervisor は grant のみ */
export function getSoftphoneProfiles(ctx: AppContext, me: SessionAccount): SoftphoneProfile[] {
  const extensions = listExtensions(ctx.db).map((e) => ({
    number: e.number,
    secret: e.secret,
    webrtc: e.webrtc,
  }));
  const granted =
    me.role === 'admin' ? [] : listGrantedExtensionNumbers(ctx.db, me.id);
  return filterSoftphoneProfiles(me.role, extensions, granted);
}
