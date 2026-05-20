import { describe, expect, it } from 'vitest';
import { resolveMiddlewareIpAllowed } from '../auth/middleware-ip-policy.js';

describe('T-SEC-IP-001: middleware IP policy (F-008)', () => {
  it('Given production and empty CIDR When resolve Then deny', () => {
    expect(
      resolveMiddlewareIpAllowed({
        ip: '203.0.113.1',
        envCidrs: [],
        nodeEnv: 'production',
      }),
    ).toBe(false);
  });

  it('Given production and matching CIDR When resolve Then allow', () => {
    expect(
      resolveMiddlewareIpAllowed({
        ip: '203.0.113.10',
        envCidrs: ['203.0.113.0/24'],
        nodeEnv: 'production',
      }),
    ).toBe(true);
  });

  it('Given development and empty CIDR When resolve Then defer true', () => {
    expect(
      resolveMiddlewareIpAllowed({
        ip: '10.0.0.1',
        envCidrs: [],
        nodeEnv: 'development',
      }),
    ).toBe(true);
  });
});
