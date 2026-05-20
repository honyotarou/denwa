import { afterEach, describe, expect, it } from 'vitest';
import { clientIpForMiddleware } from '../request-ip';
import { resolveMiddlewareIpAllowed } from '../middleware-ip';

describe('T-SEC-IP-001: middleware-ip adapter (F-008)', () => {
  const prevEnv = process.env;

  afterEach(() => {
    process.env = prevEnv;
  });

  it('Given NODE_ENV production and no IP_ALLOW_CIDRS When resolve Then false', () => {
    process.env = { ...prevEnv, NODE_ENV: 'production', IP_ALLOW_CIDRS: '' };
    expect(resolveMiddlewareIpAllowed('198.51.100.1')).toBe(false);
  });

  it('Given NODE_ENV production and allow CIDR When resolve Then true for match', () => {
    process.env = {
      ...prevEnv,
      NODE_ENV: 'production',
      IP_ALLOW_CIDRS: '198.51.100.0/24',
    };
    expect(resolveMiddlewareIpAllowed('198.51.100.5')).toBe(true);
  });

  it('Given development and no CIDR When resolve Then true', () => {
    process.env = { ...prevEnv, NODE_ENV: 'development' };
    delete process.env.IP_ALLOW_CIDRS;
    expect(resolveMiddlewareIpAllowed('10.0.0.1')).toBe(true);
  });

  it('Given production CIDR and TRUSTED_PROXY_COUNT=0 When fromHeaders Then allow loopback (docker)', () => {
    process.env = {
      ...prevEnv,
      NODE_ENV: 'production',
      TRUSTED_PROXY_COUNT: '0',
      IP_ALLOW_CIDRS: '127.0.0.0/8,172.16.0.0/12',
    };
    const ip = clientIpForMiddleware(new Headers());
    expect(resolveMiddlewareIpAllowed(ip)).toBe(true);
  });
});
