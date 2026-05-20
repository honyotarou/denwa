import type { IvrMenuDraft } from './types.js';

const NUMBER_RE = /^[0-9]{2,6}$/;
const DIGIT_RE = /^[0-9*#]$/;
const PROMPT_RE = /^[A-Za-z0-9_./-]+$/;

export function validateIvrMenuDraft(draft: IvrMenuDraft): string[] {
  const errs: string[] = [];
  if (!NUMBER_RE.test(draft.number)) errs.push('IVR 番号は 2〜6 桁');
  if (draft.options.length === 0) errs.push('options は 1 件以上');
  const prompts = [draft.welcomePrompt, draft.menuPrompt, draft.invalidPrompt, draft.goodbyePrompt];
  for (const p of prompts) {
    if (p && !PROMPT_RE.test(p)) errs.push(`prompt 名が不正: ${p}`);
  }
  const seen = new Set<string>();
  for (const o of draft.options) {
    if (!DIGIT_RE.test(o.digit)) errs.push(`digit が不正: ${o.digit}`);
    if (seen.has(o.digit)) errs.push(`digit が重複: ${o.digit}`);
    seen.add(o.digit);
    if (o.action === 'goto_extension' || o.action === 'goto_ringgroup') {
      if (!o.target || !NUMBER_RE.test(o.target)) errs.push(`target が不正: ${o.target}`);
    }
  }
  return errs;
}
