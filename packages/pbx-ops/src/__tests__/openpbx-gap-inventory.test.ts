import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('T-GAP-INV: OpenPBX gap inventory', () => {
  it('T-GAP-INV-001/002: inventory script runs (CI has no ../OpenPBX)', () => {
    const hasLegacy = fs.existsSync(path.join(ROOT, '../OpenPBX'));
    const { status, stdout, stderr } = spawnSync(
      'node',
      ['scripts/inventory-openpbx-gap.mjs'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    expect(status).toBe(0);
    const combined = `${stdout ?? ''}${stderr ?? ''}`;
    if (hasLegacy) {
      expect(combined).toMatch(/\[gap-inventory\] OK/);
    } else {
      expect(combined).toMatch(/\[gap-inventory\] skip/);
    }
  });

  it('T-GAP-GM-001: network golden exists', () => {
    const p = path.join(ROOT, 'fixtures/golden/current/openpbx-gap/network.expected.json');
    expect(fs.existsSync(p)).toBe(true);
  });
});
