import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy } from '../prod/content-security-policy.js';

describe('T-SEC-HEADERS-001: buildContentSecurityPolicy', () => {
  it('Given softphone When CSP Then connect-src allows wss', () => {
    const csp = buildContentSecurityPolicy();
    expect(csp).toContain("connect-src 'self' wss:");
    expect(csp).toContain("default-src 'self'");
  });
});
