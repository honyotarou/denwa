import { describe, expect, it } from 'vitest';
import {
  isLegacyTrunkPlaceholder,
  renderEmptyTrunksDialplan,
  renderEmptyTrunksPjsip,
} from '../trunk/empty.js';

describe('T-TRUNK-EMPTY-001', () => {
  it('Given no trunks When render empty Then no placeholder marker', () => {
    expect(renderEmptyTrunksPjsip('t')).toContain('no SIP trunks');
    expect(renderEmptyTrunksDialplan('t')).toContain('[from-trunk]');
    expect(isLegacyTrunkPlaceholder('; AUTO-GENERATED placeholder\n')).toBe(true);
    expect(isLegacyTrunkPlaceholder(renderEmptyTrunksPjsip('t'))).toBe(false);
  });
});
