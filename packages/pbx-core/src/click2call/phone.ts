/** Click-to-call 用電話番号正規化（T-CHX-*） */

export function normalizeClickToCallNumber(raw: string): string | null {
  const t = (raw ?? '').trim();
  if (!t) return null;
  if (t.startsWith('tel:')) return normalizeClickToCallNumber(t.slice(4));
  const digits = t.replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+81')) {
    const rest = digits.slice(3).replace(/^0/, '');
    if (/^\d{9,11}$/.test(rest)) return rest;
    return null;
  }
  if (digits.startsWith('0') && /^\d{9,11}$/.test(digits)) return digits;
  if (/^\d{9,11}$/.test(digits)) return digits;
  return null;
}
