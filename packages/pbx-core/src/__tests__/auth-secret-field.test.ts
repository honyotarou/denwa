import { describe, expect, it } from 'vitest';
import {
  isSecretMaskDisplay,
  resolveSecretOnUpdate,
  SECRET_MASK_DISPLAY,
} from '../auth/secret-field.js';

describe('T-SEC secret field', () => {
  it('Given mask display When isSecretMaskDisplay Then true', () => {
    expect(isSecretMaskDisplay(SECRET_MASK_DISPLAY)).toBe(true);
    expect(isSecretMaskDisplay(` ${SECRET_MASK_DISPLAY} `)).toBe(true);
  });

  it('Given real secret When isSecretMaskDisplay Then false', () => {
    expect(isSecretMaskDisplay('real-secret')).toBe(false);
  });

  it('Given empty submit When update Then keeps existing', () => {
    expect(resolveSecretOnUpdate('', 'keep-me')).toBe('keep-me');
    expect(resolveSecretOnUpdate('   ', 'keep-me')).toBe('keep-me');
  });

  it('Given mask submit When update Then keeps existing', () => {
    expect(resolveSecretOnUpdate(SECRET_MASK_DISPLAY, 'keep-me')).toBe('keep-me');
  });

  it('Given new secret When update Then uses new', () => {
    expect(resolveSecretOnUpdate('new-secret', 'old-secret')).toBe('new-secret');
  });
});
