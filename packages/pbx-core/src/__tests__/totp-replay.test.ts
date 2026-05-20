import { describe, expect, it } from 'vitest';
import { generateTotp, verifyTotpConsuming } from '../auth/totp.js';

describe('T-SEC-TOTP-001: TOTP replay guard (F-013)', () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const time = 1_700_000_000_000;

  it('Given same code twice When consuming Then second fails', () => {
    const code = generateTotp(secret, time);
    const first = verifyTotpConsuming(secret, code, null, time);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = verifyTotpConsuming(secret, code, first.counter, time);
    expect(second.ok).toBe(false);
  });
});
