import { describe, expect, it } from 'vitest';
import { renderPickupDialplan } from '../pickup/dialplan.js';
import { validatePickupGroupDraft } from '../pickup/validate.js';

describe('ピックアップグループ検証', () => {
  it('Given 正常名とメンバー When validate Then 空', () => {
    expect(validatePickupGroupDraft({ name: 'front', members: ['1001', '1002'] })).toEqual([]);
  });

  it('Given 不正メンバー When validate Then エラー', () => {
    expect(validatePickupGroupDraft({ name: 'front', members: ['x'] }).length).toBeGreaterThan(0);
  });
});

describe('ピックアップ dialplan', () => {
  it('Given 固定時刻 When render Then *8 Pickup', () => {
    const out = renderPickupDialplan({ updatedAt: 'fixed' });
    expect(out).toContain('exten => _*8,1');
    expect(out).toContain('Pickup()');
  });
});
