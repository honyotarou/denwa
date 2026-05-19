/** 曜日 UI ↔ Asterisk days_of_week 表記 */

const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekDay = (typeof WEEK)[number];

export function daysToAsterisk(picked: readonly string[]): string {
  const set = new Set(picked.filter((d) => (WEEK as readonly string[]).includes(d)));
  if (set.size === 0 || set.size === 7) return '*';
  const indices = WEEK.map((d, i) => (set.has(d) ? i : -1)).filter((i) => i >= 0);
  let consecutive = true;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      consecutive = false;
      break;
    }
  }
  if (consecutive && indices.length >= 2) {
    return `${WEEK[indices[0]]}-${WEEK[indices[indices.length - 1]]}`;
  }
  return indices.map((i) => WEEK[i]).join('&');
}

export function asteriskToDays(value: string): WeekDay[] {
  if (!value || value === '*') return [...WEEK];
  const out = new Set<WeekDay>();
  for (const part of value.split('&')) {
    const m = part.match(/^([a-z]{3})-([a-z]{3})$/);
    if (m) {
      const s = WEEK.indexOf(m[1] as WeekDay);
      const e = WEEK.indexOf(m[2] as WeekDay);
      if (s >= 0 && e >= 0) for (let i = s; i <= e; i++) out.add(WEEK[i]);
    } else if ((WEEK as readonly string[]).includes(part)) {
      out.add(part as WeekDay);
    }
  }
  return [...WEEK].filter((d) => out.has(d));
}
