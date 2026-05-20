import type { AppContext } from '../context.js';
import { requireAdmin, s } from './shared.js';
import {
  grantAccountWebRtcExtension,
  revokeAccountWebRtcExtension,
} from '../services/extension-grants.js';

export async function grantExtensionActionImpl(
  ctx: AppContext,
  formData: FormData,
): Promise<void> {
  const me = requireAdmin(ctx);
  grantAccountWebRtcExtension(
    ctx,
    me,
    Number(s(formData.get('accountId'))),
    s(formData.get('extensionNumber')),
  );
}

export async function revokeExtensionGrantActionImpl(
  ctx: AppContext,
  formData: FormData,
): Promise<void> {
  const me = requireAdmin(ctx);
  revokeAccountWebRtcExtension(
    ctx,
    me,
    Number(s(formData.get('accountId'))),
    s(formData.get('extensionNumber')),
  );
}
