const NUMBER_RE = /^[+]?[0-9*#-]{2,20}$/;

export type PhonebookDraft = Readonly<{
  name: string;
  number: string;
}>;

export function normalizePhonebookNumber(number: string): string {
  return number.replace(/[\s()]/g, '');
}

export function validatePhonebookDraft(draft: PhonebookDraft): string[] {
  const errs: string[] = [];
  if (!draft.name?.trim()) errs.push('名前は必須');
  if (!draft.number?.trim()) errs.push('番号は必須');
  const num = normalizePhonebookNumber(draft.number);
  if (draft.number.trim() && !NUMBER_RE.test(num)) errs.push('番号の形式が不正');
  return errs;
}
