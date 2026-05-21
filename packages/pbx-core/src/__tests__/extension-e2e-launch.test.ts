import { describe, expect, it } from 'vitest';
import {
  buildExtensionLoadArgs,
  hasExtensionE2eDisplay,
  resolveExtensionE2eLaunch,
  shouldSkipChromeExtensionE2e,
} from '../click2call/extension-e2e-launch.js';

describe('T-CHX-G5b extension e2e launch policy', () => {
  it('Given macOS dev When launch Then headed', () => {
    expect(hasExtensionE2eDisplay({ platform: 'darwin' })).toBe(true);
    expect(resolveExtensionE2eLaunch({ platform: 'darwin' }).headless).toBe(false);
  });

  it('Given Linux CI without DISPLAY When skip Then reason', () => {
    expect(shouldSkipChromeExtensionE2e({ ci: true, platform: 'linux', display: '' })).toMatch(/xvfb/);
  });

  it('Given Linux CI with DISPLAY When skip Then null', () => {
    expect(shouldSkipChromeExtensionE2e({ ci: true, platform: 'linux', display: ':99' })).toBeNull();
  });

  it('Given no DISPLAY on linux dev When launch Then headless new', () => {
    const o = resolveExtensionE2eLaunch({ platform: 'linux', display: '' });
    expect(o.headless).toBe(true);
    expect(o.extraArgs).toContain('--headless=new');
    expect(o.ignoreDefaultArgs).toContain('--disable-extensions');
  });

  it('buildExtensionLoadArgs', () => {
    expect(buildExtensionLoadArgs('/ext')).toEqual([
      '--disable-extensions-except=/ext',
      '--load-extension=/ext',
    ]);
  });
});
