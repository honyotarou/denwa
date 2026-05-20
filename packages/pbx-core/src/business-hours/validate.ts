const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const DAYS_RE = /^[*a-z&,-]+$/;
const NAME_RE = /^[^,|]{1,32}$/;

export function validateHolidayDate(date: string): string | null {
  if (!DATE_RE.test(date)) return '日付は YYYY-MM-DD 形式';
  return null;
}

export function validateHolidayName(name: string): string | null {
  if (!name.trim()) return '名前は必須';
  return null;
}

export type TimeRuleDraft = Readonly<{
  name: string;
  days: string;
  startTime: string;
  endTime: string;
}>;

export function validateTimeRuleDraft(draft: TimeRuleDraft): string[] {
  const errs: string[] = [];
  if (!NAME_RE.test(draft.name)) errs.push('名前は 1-32 文字 (, | 不可)');
  if (!DAYS_RE.test(draft.days)) errs.push('曜日指定が不正');
  if (!TIME_RE.test(draft.startTime)) errs.push('開始時刻は HH:MM');
  if (!TIME_RE.test(draft.endTime)) errs.push('終了時刻は HH:MM');
  if (
    TIME_RE.test(draft.startTime) &&
    TIME_RE.test(draft.endTime) &&
    draft.startTime >= draft.endTime
  ) {
    errs.push('開始時刻は終了より前');
  }
  return errs;
}
