import { describe, expect, it } from 'vitest';
import { sanitizeShellArgument, SHELL_ARG_SAFE_RE } from '../shell/argv.js';

describe('T-SEC-SHELL-001: shell argument sanitization (F-007)', () => {
  it('Given injection chars When sanitizeShellArgument Then underscores', () => {
    expect(sanitizeShellArgument('";id;#')).toBe('__id__');
  });

  it('Given Ch.3 quote-breakout payload When sanitize Then no shell metacharacters', () => {
    const poc = '"; echo INJECTED > /tmp/pwned ; echo "';
    const safe = sanitizeShellArgument(poc);
    expect(safe).not.toMatch(/[;"$`\\|&<>#]/);
  });

  it('Given safe name When sanitizeShellArgument Then unchanged', () => {
    expect(sanitizeShellArgument('Desk 1001')).toBe('Desk 1001');
    expect(SHELL_ARG_SAFE_RE.test('Desk 1001')).toBe(true);
  });
});
