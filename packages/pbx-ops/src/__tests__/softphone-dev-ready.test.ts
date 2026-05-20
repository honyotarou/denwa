import { describe, expect, it } from 'vitest';
import { softphoneDevCertsReady } from '../softphone/dev-ready.js';

describe('T-SOFT-DEV-001', () => {
  it('Given pem+key When check Then true', () => {
    const files = new Set(['/c/asterisk.pem', '/c/asterisk.key']);
    expect(softphoneDevCertsReady('/c', (p) => files.has(p))).toBe(true);
    expect(softphoneDevCertsReady('/c', () => false)).toBe(false);
  });
});
