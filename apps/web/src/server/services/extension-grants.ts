import { getExtension } from '@openpbx/db/repos/extensions';
import {
  grantExtensionToAccount,
  listGrantedExtensionNumbers,
  revokeExtensionGrant,
} from '@openpbx/db/repos/account-extension-grants';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit.js';

export function listAccountExtensionGrants(
  ctx: AppContext,
  accountId: number,
): string[] {
  return listGrantedExtensionNumbers(ctx.db, accountId);
}

export function grantAccountWebRtcExtension(
  ctx: AppContext,
  me: SessionAccount,
  accountId: number,
  extensionNumber: string,
): void {
  const ext = getExtension(ctx.db, extensionNumber);
  if (!ext?.webrtc) throw new Error('WebRTC 有効な内線のみ割当できます');
  grantExtensionToAccount(ctx.db, accountId, extensionNumber);
  audit(ctx, me, 'extension.grant', `${accountId}:${extensionNumber}`);
}

export function revokeAccountWebRtcExtension(
  ctx: AppContext,
  me: SessionAccount,
  accountId: number,
  extensionNumber: string,
): void {
  revokeExtensionGrant(ctx.db, accountId, extensionNumber);
  audit(ctx, me, 'extension.grant.revoke', `${accountId}:${extensionNumber}`);
}
