import { describe, expect, it } from 'vitest';
import { parsePasswordPolicyForm, toPasswordPolicy } from '../auth/policy-settings.js';

describe('password policy settings', () => {
  it('Given form When parse Then clamped settings', () => {
    const s = parsePasswordPolicyForm({
      minLength: 99,
      requireLowercase: true,
      requireUppercase: true,
      requireDigit: false,
      requireSymbol: true,
      rotationDays: -1,
      lockoutThreshold: 0,
    });
    expect(s.minLength).toBe(64);
    expect(s.rotationDays).toBe(0);
    expect(s.lockoutThreshold).toBe(1);
    expect(toPasswordPolicy(s).requireSymbol).toBe(true);
  });
});
