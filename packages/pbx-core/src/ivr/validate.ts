import { parseIvrNumber } from '../brands.js';
import type { IvrMenuDraft, IvrMenuDraftInput } from './types.js';

const DIGIT_RE = /^[0-9*#]$/;
const PROMPT_RE = /^[A-Za-z0-9_./-]+$/;
const NUMBER_RE = /^[0-9]{2,6}$/;

export function validateIvrMenuDraftInput(input: IvrMenuDraftInput): string[] {
  const errs: string[] = [];
  if (!parseIvrNumber(input.number)) errs.push('IVR 番号は 2〜6 桁');
  if (input.options.length === 0) errs.push('options は 1 件以上');
  const prompts = [input.welcomePrompt, input.menuPrompt, input.invalidPrompt, input.goodbyePrompt];
  for (const p of prompts) {
    if (p && !PROMPT_RE.test(p)) errs.push(`prompt 名が不正: ${p}`);
  }
  const seen = new Set<string>();
  for (const o of input.options) {
    if (!DIGIT_RE.test(o.digit)) errs.push(`digit が不正: ${o.digit}`);
    if (seen.has(o.digit)) errs.push(`digit が重複: ${o.digit}`);
    seen.add(o.digit);
    if (o.action === 'goto_extension' || o.action === 'goto_ringgroup') {
      if (!o.target || !NUMBER_RE.test(o.target)) errs.push(`target が不正: ${o.target}`);
    }
  }
  return errs;
}

/** @deprecated alias — input 版を正本 */
export function validateIvrMenuDraft(input: IvrMenuDraftInput): string[] {
  return validateIvrMenuDraftInput(input);
}

export function toIvrMenuDraft(input: IvrMenuDraftInput): IvrMenuDraft {
  const number = parseIvrNumber(input.number);
  if (!number) throw new Error(`invalid ivr number: ${input.number}`);
  return { ...input, number };
}
