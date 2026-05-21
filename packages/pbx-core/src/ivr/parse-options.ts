import type { IvrAction, IvrOptionDraft } from './types.js';

/** 1 行 1 項目: digit|action|target|label */
export function parseIvrOptionsText(raw: string): readonly IvrOptionDraft[] {
  const out: IvrOptionDraft[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const [digit, action, target, label] = t.split('|').map((x) => x?.trim() ?? '');
    if (!digit || !action) continue;
    out.push({
      digit,
      action: action as IvrAction,
      target: target || null,
      label: label || null,
    });
  }
  return out;
}
