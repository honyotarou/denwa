import { describe, expect, it } from 'vitest';
import { sanitizeIniDisplayName, validateIniFieldValue } from '../ini/sanitize.js';

describe('T-SEC-INI-001: sanitizeIni single source', () => {
  it('Given newline in displayName When validate Then error', () => {
    expect(validateIniFieldValue('foo\n[evil]')).not.toBeNull();
  });

  it('Given bracket in displayName When sanitizeIniDisplayName Then strips unsafe', () => {
    const out = sanitizeIniDisplayName('foo[evil]', 'Ext 1001');
    expect(out).not.toMatch(/[\[\]]/);
  });

  it('Given safe name When sanitizeIniDisplayName Then preserved', () => {
    expect(sanitizeIniDisplayName('Reception', 'Ext')).toBe('Reception');
  });
});
