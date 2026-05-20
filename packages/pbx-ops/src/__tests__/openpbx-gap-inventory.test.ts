import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('T-GAP-INV: OpenPBX gap inventory', () => {
  it('T-GAP-INV-001/002: inventory script runs', () => {
    const out = execSync('node scripts/inventory-openpbx-gap.mjs', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    if (fs.existsSync(path.join(ROOT, '../OpenPBX'))) {
      expect(out).toMatch(/OK/);
    } else {
      expect(out).toMatch(/skip/);
    }
  });

  it('T-GAP-GM-001: network golden exists', () => {
    const p = path.join(ROOT, 'fixtures/golden/current/openpbx-gap/network.expected.json');
    expect(fs.existsSync(p)).toBe(true);
  });
});
