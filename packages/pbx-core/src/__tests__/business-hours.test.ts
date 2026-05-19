import { describe, expect, it } from 'vitest';
import { renderBusinessHoursDialplan } from '../business-hours/dialplan.js';
import { asteriskToDays, daysToAsterisk } from '../business-hours/days.js';
import {
  validateHolidayDate,
  validateHolidayName,
  validateTimeRuleDraft,
} from '../business-hours/validate.js';

describe('曜日 ↔ Asterisk 表記', () => {
  it('Given 月〜金 When daysToAsterisk Then mon-fri', () => {
    expect(daysToAsterisk(['mon', 'tue', 'wed', 'thu', 'fri'])).toBe('mon-fri');
  });

  it('Given mon-fri When asteriskToDays Then 5 日', () => {
    expect(asteriskToDays('mon-fri')).toEqual(['mon', 'tue', 'wed', 'thu', 'fri']);
  });

  it('Given 全曜 When daysToAsterisk Then *', () => {
    expect(daysToAsterisk(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).toBe('*');
  });
});

describe('業務時間バリデーション', () => {
  it('Given 不正日付 When validateHolidayDate Then エラー', () => {
    expect(validateHolidayDate('2026/1/1')).not.toBeNull();
  });

  it('Given 空名前 When validateHolidayName Then エラー', () => {
    expect(validateHolidayName('  ')).not.toBeNull();
  });

  it('Given 正常ルール When validateTimeRuleDraft Then 空', () => {
    expect(
      validateTimeRuleDraft({
        name: '平日昼',
        days: 'mon-fri',
        startTime: '09:00',
        endTime: '18:00',
      }),
    ).toEqual([]);
  });
});

describe('業務時間 dialplan 生成', () => {
  it('Given 祝日とルール When render Then GotoIfTime が含まれる', () => {
    const out = renderBusinessHoursDialplan(
      [{ name: '平日', days: 'mon-fri', startTime: '09:00', endTime: '18:00' }],
      [{ date: '2026-01-01', name: '元日' }],
      { updatedAt: 'fixed' },
    );
    expect(out).toContain('[businesshours]');
    expect(out).toContain('GotoIfTime(09:00-18:00,mon-fri,*,*?open)');
    expect(out).toContain('2026-01-01');
  });
});
