import { normalizePhonebookNumber } from './validate.js';

export type PhonebookEntry = Readonly<{
  name: string;
  number: string;
  category?: string | null;
}>;

/** T-PB-005/006: 完全一致 → 正規化番号一致 */
export function lookupPhonebook(
  query: string,
  entries: readonly PhonebookEntry[],
): PhonebookEntry | null {
  const direct = entries.find((e) => e.number === query);
  if (direct) return direct;
  const norm = normalizePhonebookNumber(query);
  return entries.find((e) => normalizePhonebookNumber(e.number) === norm) ?? null;
}
