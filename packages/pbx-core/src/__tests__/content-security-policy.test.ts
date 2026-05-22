import { describe, expect, it } from 'vitest';
import {
  buildContentSecurityPolicy,
  wssConnectHostsForRequestHost,
} from '../prod/content-security-policy.js';

describe('T-SEC-CSP-001: buildContentSecurityPolicy', () => {
  it('Given nonce When CSP Then no unsafe-inline', () => {
    const csp = buildContentSecurityPolicy({ scriptNonce: 'abc123' });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it('Given wss host When CSP Then connect-src allowlist (no wss: wildcard)', () => {
    const csp = buildContentSecurityPolicy({
      wssConnectHosts: ['wss://pbx.local:8089'],
    });
    expect(csp).toContain("connect-src 'self' wss://pbx.local:8089");
    expect(csp.match(/connect-src ([^;]+)/)?.[1]).toBe("'self' wss://pbx.local:8089");
  });

  it('Given request host When wssConnectHostsForRequestHost Then port 8089', () => {
    expect(wssConnectHostsForRequestHost('localhost:3000')).toEqual(['wss://localhost:8089']);
  });
});
