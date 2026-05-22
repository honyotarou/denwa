import { describe, expect, it } from 'vitest';
import {
  canReadRecordings,
  canStreamDevices,
  canWritePbxConfig,
  roleMeetsMin,
} from '../auth/pbx-api-policy.js';

describe('T-SEC pbx-api-policy roles', () => {
  it('Given user When canWritePbxConfig Then false', () => {
    expect(canWritePbxConfig('user')).toBe(false);
  });

  it('Given supervisor When canWritePbxConfig Then true', () => {
    expect(canWritePbxConfig('supervisor')).toBe(true);
  });

  it('Given user When canReadRecordings/canStreamDevices Then false', () => {
    expect(canReadRecordings('user')).toBe(false);
    expect(canStreamDevices('user')).toBe(false);
  });

  it('Given supervisor When canReadRecordings/canStreamDevices Then true', () => {
    expect(canReadRecordings('supervisor')).toBe(true);
    expect(canStreamDevices('supervisor')).toBe(true);
  });

  it('Given roleMeetsMin Then rank order', () => {
    expect(roleMeetsMin('admin', 'supervisor')).toBe(true);
    expect(roleMeetsMin('user', 'supervisor')).toBe(false);
  });
});
