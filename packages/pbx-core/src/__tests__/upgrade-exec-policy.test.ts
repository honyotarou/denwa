import { describe, expect, it } from 'vitest';
import { isUpgradeAutoExecEnabled } from '../upgrade/exec-policy.js';

describe('T-UPG-EXEC-001', () => {
  it('Given ALLOW_UPGRADE_EXEC=1 When check Then true', () => {
    expect(isUpgradeAutoExecEnabled({ ALLOW_UPGRADE_EXEC: '1' })).toBe(true);
    expect(isUpgradeAutoExecEnabled({})).toBe(false);
  });
});
