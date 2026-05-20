import {
  toIvrMenuDraft,
  validateIvrMenuDraftInput,
  type IvrMenuDraftInput,
} from '@openpbx/core';
import { createIvrMenu, updateIvrMenu, deleteIvrMenu, isDuplicateError } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';
import { throwIfInvalid } from './validate';

export async function upsertIvrWithSync(
  ctx: AppContext,
  me: SessionAccount,
  input: IvrMenuDraftInput,
): Promise<void> {
  throwIfInvalid(validateIvrMenuDraftInput(input));
  const draft = toIvrMenuDraft(input);
  const options = draft.options.map((o) => ({
    digit: o.digit,
    action: o.action,
    target: o.target,
    label: o.label,
  }));
  try {
    createIvrMenu(ctx.db, { number: draft.number, name: draft.name ?? undefined, options });
  } catch (e) {
    if (isDuplicateError(e)) {
      updateIvrMenu(ctx.db, { number: draft.number, name: draft.name ?? undefined, options });
    } else throw e;
  }
  await ctx.infra.syncIvr();
  audit(ctx, me, 'ivr.upsert', draft.number);
}

export async function deleteIvrWithSync(
  ctx: AppContext,
  me: SessionAccount,
  number: string,
): Promise<void> {
  deleteIvrMenu(ctx.db, number);
  await ctx.infra.syncIvr();
  audit(ctx, me, 'ivr.delete', number);
}
