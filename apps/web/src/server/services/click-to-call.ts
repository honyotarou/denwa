import {
  generateClickToCallTokenPlain,
  hashClickToCallToken,
  validateClickToCallTokenName,
} from '@openpbx/core';
import {
  createClickToCallToken,
  listClickToCallTokens,
  revokeClickToCallToken,
  type ClickToCallTokenRow,
} from '@openpbx/db/repos/click-to-call-tokens';
import { getExtension } from '@openpbx/db/repos/extensions';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit.js';

export function listMyClickToCallTokens(
  ctx: AppContext,
  me: SessionAccount,
): ClickToCallTokenRow[] {
  return listClickToCallTokens(ctx.db, me.id);
}

export function createMyClickToCallToken(
  ctx: AppContext,
  me: SessionAccount,
  input: Readonly<{ name: string; fromExtension: string }>,
): Readonly<{ plain: string; row: ClickToCallTokenRow }> {
  const nameErr = validateClickToCallTokenName(input.name);
  if (nameErr) throw new Error(nameErr);
  const ext = getExtension(ctx.db, input.fromExtension);
  if (!ext) throw new Error('発信元内線が存在しません');
  const plain = generateClickToCallTokenPlain();
  const row = createClickToCallToken(ctx.db, {
    accountId: me.id,
    name: input.name.trim(),
    tokenHash: hashClickToCallToken(plain),
    fromExtension: input.fromExtension,
  });
  audit(ctx, me, 'click2call.token.create', input.name);
  return { plain, row };
}

export function revokeMyClickToCallToken(
  ctx: AppContext,
  me: SessionAccount,
  tokenId: number,
): void {
  revokeClickToCallToken(ctx.db, tokenId, me.id);
  audit(ctx, me, 'click2call.token.revoke', String(tokenId));
}
