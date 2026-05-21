import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

describe('T-GAP-DOC: gap migration docs', () => {
  it('T-GAP-DOC-001: README documents /network', () => {
    const t = read('README.md');
    expect(t).toContain('/network');
    expect(t).toMatch(/transports\.conf|pjsip\.d/i);
  });

  it('T-GAP-DOC-002: README documents WebRTC cert / softphone dev', () => {
    const t = read('README.md');
    expect(t).toMatch(/softphone|WebRTC|mkcert|gen-dev-asterisk|8089/i);
  });

  it('T-GAP-DOC-003: README documents Chrome extension', () => {
    const t = read('README.md');
    expect(t).toContain('chrome-extension');
    expect(fs.existsSync(path.join(ROOT, 'chrome-extension/manifest.json'))).toBe(true);
  });

  it('T-GAP-DOC-004: SECURITY-MAP softphone secret policy', () => {
    const t = read('docs/SECURITY-MAP.md');
    expect(t).toMatch(/T-GAP-DOC-004|softphone secret|account_extension_grants/i);
  });

  it('T-GAP-DOC-005: SECURITY-MAP click-to-call Bearer policy', () => {
    const t = read('docs/SECURITY-MAP.md');
    expect(t).toMatch(/T-GAP-DOC-005|click-to-call|Bearer/i);
  });
});
