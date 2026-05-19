import type { TrunkDraft } from './types.js';

const NAME_RE = /^[A-Za-z0-9_-]{1,32}$/;

export function validateTrunkDraft(draft: TrunkDraft): string[] {
  const errs: string[] = [];
  if (!NAME_RE.test(draft.name)) errs.push('name は 1-32 文字、英数 / _ / -');
  if (!draft.host.trim()) errs.push('host は必須');
  if (draft.port < 1 || draft.port > 65535) errs.push('port は 1-65535');
  return errs;
}
