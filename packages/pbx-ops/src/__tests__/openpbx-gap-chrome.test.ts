import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateChromeExtensionManifest, validateExtensionUsesLocalStorage } from '@openpbx/core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('T-CHX-006 chrome-extension', () => {
  it('manifest is MV3 minimal permissions', () => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'chrome-extension/manifest.json'), 'utf8'),
    );
    expect(validateChromeExtensionManifest(raw)).toEqual([]);
  });

  it('T-SEC-EXT-001: no wildcard host permissions', () => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'chrome-extension/manifest.json'), 'utf8'),
    );
    expect(raw.host_permissions).not.toContain('https://*/*');
  });

  it('T-SEC-EXT-002: bundled scripts use local storage', () => {
    const bg = fs.readFileSync(path.join(ROOT, 'chrome-extension/background.js'), 'utf8');
    const opts = fs.readFileSync(path.join(ROOT, 'chrome-extension/options.js'), 'utf8');
    expect(validateExtensionUsesLocalStorage(bg)).toEqual([]);
    expect(validateExtensionUsesLocalStorage(opts)).toEqual([]);
  });

  it('T-SEC-EXT-003: content.js does not use innerHTML', () => {
    const content = fs.readFileSync(path.join(ROOT, 'chrome-extension/content.js'), 'utf8');
    expect(content).not.toMatch(/\.innerHTML\s*=/);
    expect(content).toMatch(/createTextNode|textContent/);
  });

  it('T-GAP-SEC-003: no CDN sip.js in apps/web', () => {
    const webSrc = path.join(ROOT, 'apps/web/src');
    const bad: string[] = [];
    function walk(dir: string) {
      for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, name.name);
        if (name.isDirectory()) walk(p);
        else if (/\.(tsx?|jsx?)$/.test(name.name)) {
          const t = fs.readFileSync(p, 'utf8');
          if (/cdn\.jsdelivr\.net\/npm\/sip\.js/i.test(t)) bad.push(path.relative(ROOT, p));
        }
      }
    }
    walk(webSrc);
    expect(bad).toEqual([]);
  });
});
