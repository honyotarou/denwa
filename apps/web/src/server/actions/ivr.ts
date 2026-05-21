import { parseIvrOptionsText, type IvrMenuDraftInput, type IvrOptionDraft } from '@openpbx/core';
import type { AppContext } from '../context.js';
import { requireUser, s } from './shared.js';
import { deleteIvrWithSync, upsertIvrWithSync } from '../services/ivr';

function parseIvrOptions(formData: FormData): readonly IvrOptionDraft[] {
  const json = s(formData.get('optionsJson'));
  if (json) {
    return JSON.parse(json) as IvrOptionDraft[];
  }
  const raw = s(formData.get('options'));
  if (raw) return parseIvrOptionsText(raw);
  const digit = s(formData.get('digit'));
  const action = s(formData.get('action')) as IvrOptionDraft['action'];
  if (digit && action) {
    return [{ digit, action, target: s(formData.get('target')) || null, label: null }];
  }
  return [];
}

function buildIvrDraftFromForm(formData: FormData): IvrMenuDraftInput {
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
  await upsertIvrWithSync(ctx, me, buildIvrDraftFromForm(formData));
}

export async function deleteIvrActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  await deleteIvrWithSync(ctx, me, s(formData.get('number')));
}
