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

function toDbInput(input: IvrMenuDraftInput) {
  const draft = toIvrMenuDraft(input);
  return {
    number: draft.number,
    name: draft.name,
    welcomePrompt: draft.welcomePrompt,
    menuPrompt: draft.menuPrompt,
    invalidPrompt: draft.invalidPrompt,
    goodbyePrompt: draft.goodbyePrompt,
    maxRetries: draft.maxRetries,
    waitSeconds: draft.waitSeconds,
    options: draft.options.map((o) => ({
      digit: o.digit,
      action: o.action,
      target: o.target,
      label: o.label,
    })),
  };
}

export async function upsertIvrWithSync(
  ctx: AppContext,
  me: SessionAccount,
  input: IvrMenuDraftInput,
): Promise<void> {
  throwIfInvalid(validateIvrMenuDraftInput(input));
  const dbInput = toDbInput(input);
  try {
    createIvrMenu(ctx.db, dbInput);
  } catch (e) {
    if (isDuplicateError(e)) {
      updateIvrMenu(ctx.db, dbInput);
    } else throw e;
  }
  await ctx.infra.syncIvr();
  audit(ctx, me, 'ivr.upsert', dbInput.number);
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
