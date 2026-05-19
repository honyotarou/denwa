import { describe, expect, it } from 'vitest';
import { canViewAudit, extensionForRole } from '../auth/access.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import {
  DEFAULT_PASSWORD_POLICY,
  isIpAllowed,
  isValidCidr,
  validatePasswordAgainstPolicy,
} from '../auth/policy.js';

describe('パスワード hash', () => {
  it('Given 平文 When hash → verify Then true', () => {
    const stored = hashPassword('correct-horse');
    expect(verifyPassword('correct-horse', stored)).toBe(true);
    expect(verifyPassword('wrong', stored)).toBe(false);
  });
});

describe('パスワードポリシー', () => {
  it('Given デフォルトポリシーと短いパスワード When validate Then エラー', () => {
    expect(validatePasswordAgainstPolicy('Ab1', DEFAULT_PASSWORD_POLICY)).toContain('8 文字以上');
  });

  it('Given 大文字必須ポリシー When validate Then 大文字なしはエラー', () => {
    const errs = validatePasswordAgainstPolicy('abcdefg1', {
      ...DEFAULT_PASSWORD_POLICY,
      requireUppercase: true,
    });
    expect(errs).toContain('大文字を含む');
  });
});

describe('IP allow list', () => {
  it('Given 空リスト When isIpAllowed Then 常に true', () => {
    expect(isIpAllowed('203.0.113.1', [])).toBe(true);
  });

  it('Given 192.168.0.0/16 When 192.168.1.10 Then true', () => {
    expect(isIpAllowed('192.168.1.10', ['192.168.0.0/16'])).toBe(true);
    expect(isIpAllowed('10.0.0.1', ['192.168.0.0/16'])).toBe(false);
  });

  it('Given 不正 CIDR When isValidCidr Then false', () => {
    expect(isValidCidr('999.1.1.1/8')).toBe(false);
  });
});

describe('API 認可（secret 漏洩防止）', () => {
  it('Given admin When extensionForRole Then secret 付き', () => {
    const view = extensionForRole(
      {
        number: '1001',
        displayName: null,
        note: null,
        webrtc: false,
        updatedAt: 't',
        secret: 'top-secret',
      },
      'admin',
    );
    expect(view.secret).toBe('top-secret');
  });

  it('Given user When extensionForRole Then secret なし', () => {
    const view = extensionForRole(
      {
        number: '1001',
        displayName: null,
        note: null,
        webrtc: false,
        updatedAt: 't',
        secret: 'top-secret',
      },
      'user',
    );
    expect('secret' in view).toBe(false);
  });

  it('Given supervisor When canViewAudit Then true', () => {
    expect(canViewAudit('supervisor')).toBe(true);
    expect(canViewAudit('user')).toBe(false);
  });
});
