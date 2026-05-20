import { describe, expect, it } from 'vitest';
import { pjsipTransportsConfRequiresInternalSrtp } from '../pjsip/endpoint-security.js';

const SAMPLE = `
[endpoint-internal](!)
type=endpoint
media_encryption=sdes
media_encryption_optimistic=no
`;

describe('T-SEC-RTP-001: internal endpoint SRTP (F-016)', () => {
  it('Given template with sdes When check Then true', () => {
    expect(pjsipTransportsConfRequiresInternalSrtp(SAMPLE)).toBe(true);
  });

  it('Given template without sdes When check Then false', () => {
    expect(
      pjsipTransportsConfRequiresInternalSrtp('[endpoint-internal](!)\ntype=endpoint\n'),
    ).toBe(false);
  });
});
