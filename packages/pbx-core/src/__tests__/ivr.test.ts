import { describe, expect, it } from 'vitest';
import { renderIvrDialplan } from '../ivr/dialplan.js';
import { validateIvrMenuDraft } from '../ivr/validate.js';

const sampleMenu = {
  number: '5000',
  name: 'Main',
  welcomePrompt: 'welcome',
  menuPrompt: 'menu',
  invalidPrompt: null,
  goodbyePrompt: 'bye',
  maxRetries: 3,
  waitSeconds: 6,
  options: [
    { digit: '1', action: 'goto_extension' as const, target: '1001', label: '内線' },
    { digit: '2', action: 'goto_ringgroup' as const, target: '6000', label: 'G' },
  ],
};

describe('IVR バリデーション', () => {
  it('Given 正常メニュー When validate Then 空', () => {
    expect(validateIvrMenuDraft(sampleMenu)).toEqual([]);
  });

  it('Given digit 重複 When validate Then エラー', () => {
    const errs = validateIvrMenuDraft({
      ...sampleMenu,
      options: [
        { digit: '1', action: 'hangup', target: null, label: null },
        { digit: '1', action: 'hangup', target: null, label: null },
      ],
    });
    expect(errs.some((e) => e.includes('重複'))).toBe(true);
  });
});

describe('IVR dialplan 生成', () => {
  it('Given メニュー When render Then context と Goto', () => {
    const out = renderIvrDialplan([sampleMenu], { updatedAt: 'fixed' });
    expect(out).toContain('[ivr-5000]');
    expect(out).toContain('Goto(internal,1001,1)');
    expect(out).toContain('Goto(ringgroups,6000,1)');
  });
});
