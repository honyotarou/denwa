import { describe, expect, it } from 'vitest';
import {
  validateClickToCallTokenName,
  clickToCallFromMatchesToken,
  hashClickToCallToken,
  verifyClickToCallTokenPlain,
  parseBearerAuthorization,
} from '../click2call/token.js';
import { validateChromeExtensionManifest } from '../click2call/manifest.js';
import { filterSoftphoneProfiles } from '../softphone/policy.js';

describe('T-SOFT policy', () => {
  const exts = [
    { number: '1001', secret: 's1', webrtc: true },
    { number: '1002', secret: 's2', webrtc: false },
    { number: '1003', secret: 's3', webrtc: true },
  ];

  it('T-SOFT-001: admin gets all webrtc secrets', () => {
    const p = filterSoftphoneProfiles('admin', exts, []);
    expect(p).toEqual([
      { number: '1001', secret: 's1' },
      { number: '1003', secret: 's3' },
    ]);
  });

  it('T-SOFT-002: user without grant gets empty', () => {
    expect(filterSoftphoneProfiles('user', exts, [])).toEqual([]);
  });

  it('T-SOFT-003: user with grant gets granted only', () => {
    expect(filterSoftphoneProfiles('user', exts, ['1003'])).toEqual([
      { number: '1003', secret: 's3' },
    ]);
  });
});

describe('T-CHX token', () => {
  it('T-CHX-011: hash verify', () => {
    const plain = 'abc';
    const h = hashClickToCallToken(plain);
    expect(verifyClickToCallTokenPlain(plain, h)).toBe(true);
    expect(verifyClickToCallTokenPlain('wrong', h)).toBe(false);
  });

  it('T-CHX-014: from must match token policy', () => {
    expect(clickToCallFromMatchesToken('1001', '1001')).toBe(true);
    expect(clickToCallFromMatchesToken('1002', '1001')).toBe(false);
  });

  it('bearer parse', () => {
    expect(parseBearerAuthorization('Bearer tok')).toBe('tok');
    expect(parseBearerAuthorization(null)).toBeNull();
  });

  it('token name validation', () => {
    expect(validateClickToCallTokenName('my-ext')).toBeNull();
    expect(validateClickToCallTokenName('')).not.toBeNull();
  });
});

describe('T-CHX-006 manifest', () => {
  it('valid MV3 minimal', () => {
    expect(
      validateChromeExtensionManifest({
        manifest_version: 3,
        permissions: ['storage', 'contextMenus'],
      }),
    ).toEqual([]);
  });

  it('rejects extra permissions', () => {
    expect(
      validateChromeExtensionManifest({
        manifest_version: 3,
        permissions: ['tabs', 'storage'],
      }),
    ).not.toEqual([]);
  });
});
