import { validateIvrMenuDraft, type IvrMenuDraft, type IvrOptionDraft } from '@openpbx/core';
import { createIvrMenu, updateIvrMenu, deleteIvrMenu, DuplicateError } from '@openpbx/db';
import type { AppContext } from '../context.js';
import { audit, requireUser, s } from './shared.js';

function parseIvrOptions(formData: FormData): readonly IvrOptionDraft[] {
  const json = s(formData.get('optionsJson'));
  if (json) {
    const parsed = JSON.parse(json) as IvrOptionDraft[];
    return parsed;
  }
  const digit = s(formData.get('digit'));
  const action = s(formData.get('action')) as IvrOptionDraft['action'];
  if (digit && action) {
    return [{ digit, action, target: s(formData.get('target')) || null, label: null }];
  }
  return [];
}

function buildIvrDraftFromForm(formData: FormData): IvrMenuDraft {
  return {
    number: s(formData.get('number')),
    name: s(formData.get('name')) || null,
    welcomePrompt: s(formData.get('welcomePrompt')) || null,
    menuPrompt: s(formData.get('menuPrompt')) || null,
    invalidPrompt: s(formData.get('invalidPrompt')) || null,
    goodbyePrompt: s(formData.get('goodbyePrompt')) || null,
    maxRetries: Number(s(formData.get('maxRetries')) || '3'),
    waitSeconds: Number(s(formData.get('waitSeconds')) || '6'),
    options: parseIvrOptions(formData),
  };
}


// T-ACT-018〜019 IVR
export async function upsertIvrActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  const draft = buildIvrDraftFromForm(formData);
  const errs = validateIvrMenuDraft(draft);
  if (errs.length) throw new Error(errs.join('; '));
  const options = draft.options.map((o) => ({
    digit: o.digit,
    action: o.action,
    target: o.target,
    label: o.label,
  }));
  try {
    createIvrMenu(ctx.db, { number: draft.number, name: draft.name ?? undefined, options });
  } catch (e) {
    if (e instanceof DuplicateError) {
      updateIvrMenu(ctx.db, { number: draft.number, name: draft.name ?? undefined, options });
    } else throw e;
  }
  await ctx.infra.syncIvr();
  audit(ctx, me, 'ivr.upsert', draft.number);
}

export async function deleteIvrActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  const number = s(formData.get('number'));
  deleteIvrMenu(ctx.db, number);
  await ctx.infra.syncIvr();
  audit(ctx, me, 'ivr.delete', number);
}

