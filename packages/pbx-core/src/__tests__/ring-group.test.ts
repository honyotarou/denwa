import { describe, expect, it } from 'vitest';
import { renderRingGroupDialplan, validateRingGroupDraft } from '../ring-group.js';

describe('着信グループの検証', () => {
  it('Given ringall とメンバー When validate Then エラーなし', () => {
    expect(
      validateRingGroupDraft({
        number: '6001',
        name: '受付',
        strategy: 'ringall',
        ringSeconds: 30,
        fallbackExtension: null,
        members: ['1001', '1002'],
      }),
    ).toEqual([]);
  });

  it('Given 呼出 4 秒 When validate Then エラー', () => {
    expect(
      validateRingGroupDraft({
        number: '6001',
        name: null,
        strategy: 'ringall',
        ringSeconds: 4,
        fallbackExtension: null,
        members: ['1001'],
      }).length,
    ).toBeGreaterThan(0);
  });
});

describe('着信グループ dialplan', () => {
  it('Given ringall 6001 When render Then 同時 Dial', () => {
    const out = renderRingGroupDialplan(
      [
        {
          number: '6001',
          name: '受付',
          strategy: 'ringall',
          ringSeconds: 25,
          fallbackExtension: '1000',
          members: ['1001', '1002'],
        },
      ],
      { updatedAt: 'fixed' },
    );
    expect(out).toContain('Dial(PJSIP/1001&PJSIP/1002,25,tTm)');
    expect(out).toContain('Goto(internal,1000,1)');
  });

  it('Given メンバー 0 When render Then invalid 再生', () => {
    const out = renderRingGroupDialplan(
      [
        {
          number: '6002',
          name: null,
          strategy: 'linear',
          ringSeconds: 30,
          fallbackExtension: null,
          members: [],
        },
      ],
      { updatedAt: 'fixed' },
    );
    expect(out).toContain('Playback(invalid)');
  });
});
