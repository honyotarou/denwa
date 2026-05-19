import { describe, expect, it } from 'vitest';
import { billingRowCost, computeCallCost, pickRateForDst } from '../billing/cost.js';

describe('課金レートのマッチ', () => {
  const rates = [
    { prefix: '0', perMin: 10, setupFee: 0 },
    { prefix: '03', perMin: 3, setupFee: 5 },
  ] as const;

  it('Given 長い prefix が先にマッチ When pickRateForDst Then 03 系', () => {
    expect(pickRateForDst('0312345678', rates)?.prefix).toBe('03');
  });

  it('Given 該当なし When pickRateForDst Then null', () => {
    expect(pickRateForDst('999', rates)).toBeNull();
  });
});

describe('通話料金計算', () => {
  it('Given 60 秒と 10 円/分 When computeCallCost Then 10 円', () => {
    expect(computeCallCost(60, { prefix: '0', perMin: 10, setupFee: 0 })).toBe(10);
  });

  it('Given billsec 0 When computeCallCost Then 0', () => {
    expect(computeCallCost(0, { prefix: '0', perMin: 10, setupFee: 5 })).toBe(0);
  });

  it('Given setupFee と秒数 When billingRowCost Then 丸めた cost', () => {
    const { cost, rate } = billingRowCost('0312', 90, [{ prefix: '03', perMin: 6, setupFee: 2 }]);
    expect(rate?.prefix).toBe('03');
    expect(cost).toBe(11);
  });
});
