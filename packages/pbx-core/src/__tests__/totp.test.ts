import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  buildOtpauthUri,
  generateTotp,
  verifyTotp,
} from '../auth/totp.js';

describe('TOTP', () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const time = 1_700_000_000_000;

  it('Given 生成コード When verifyTotp 同時刻 Then true', () => {
    const code = generateTotp(secret, time);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotp(secret, code, time)).toBe(true);
  });

  it('Given 誤コード When verifyTotp Then false', () => {
    expect(verifyTotp(secret, '000000', time)).toBe(false);
  });

  it('Given base32 roundtrip When encode/decode Then 一致', () => {
    const buf = Buffer.from('hello');
    expect(base32Decode(base32Encode(buf)).toString()).toBe('hello');
  });

  it('Given アカウント When buildOtpauthUri Then otpauth URL', () => {
    expect(buildOtpauthUri('admin', secret)).toContain('otpauth://totp/');
    expect(buildOtpauthUri('admin', secret)).toContain('secret=JBSWY3DPEHPK3PXP');
  });
});
