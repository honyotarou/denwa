import { describe, expect, it } from 'vitest';
import { showDevicesLink, showNetworkLink, showPatientsLink, showRecordingsLink, showTriageLink } from '@/lib/nav-policy';

describe('gap nav policy', () => {
  it('T-NET-013: Given admin When showNetworkLink Then true', () => {
    expect(showNetworkLink('admin')).toBe(true);
  });

  it('T-NET-014: Given user When showNetworkLink Then false', () => {
    expect(showNetworkLink('user')).toBe(false);
  });

  it('T-PAT-024: Given user When showPatientsLink Then true', () => {
    expect(showPatientsLink('user')).toBe(true);
  });

  it('T-TRIAGE-013: Given user When showTriageLink Then true', () => {
    expect(showTriageLink('user')).toBe(true);
  });

  it('T-SEC-A01-004: Given user When showDevicesLink/showRecordingsLink Then false', () => {
    expect(showDevicesLink('user')).toBe(false);
    expect(showRecordingsLink('user')).toBe(false);
  });

  it('T-SEC-A01-004: Given supervisor When showDevicesLink/showRecordingsLink Then true', () => {
    expect(showDevicesLink('supervisor')).toBe(true);
    expect(showRecordingsLink('supervisor')).toBe(true);
  });
});
