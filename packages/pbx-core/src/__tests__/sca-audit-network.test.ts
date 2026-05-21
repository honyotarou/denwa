import { describe, expect, it } from 'vitest';
import {
  classifyNpmAuditExecError,
  isNpmRegistryUnavailable,
} from '../prod/sca-audit-network.js';

describe('T-SEC-SCA-004: npm audit network classification', () => {
  it('Given ENOTFOUND When classify Then skip registry', () => {
    const out = classifyNpmAuditExecError({
      status: 1,
      stderr: 'npm warn audit request failed, reason: getaddrinfo ENOTFOUND registry.npmjs.org',
    });
    expect(out).toEqual({
      kind: 'skip',
      reason: 'registry_unavailable',
      detail: expect.stringContaining('ENOTFOUND'),
    });
  });

  it('Given audit vulnerabilities When classify Then blocked', () => {
    expect(
      classifyNpmAuditExecError({ status: 1, stdout: 'found 2 vulnerabilities' }).kind,
    ).toBe('blocked');
  });

  it('Given registry hint When isNpmRegistryUnavailable Then true', () => {
    expect(isNpmRegistryUnavailable('audit endpoint returned an error')).toBe(true);
  });
});
