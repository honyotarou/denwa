import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { RingGroupDraft } from '../ring-group.js';
import { renderRingGroupDialplan } from '../ring-group.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN_DIR = path.join(ROOT, 'fixtures/golden/current/dialplan');

type GoldenInput = {
  updatedAt: string;
  groups: RingGroupDraft[];
};

describe('T-GM-002: golden dialplan/ringgroups.conf', () => {
  it('Given ringall/linear/空メンバー When renderRingGroupDialplan Then golden と一致', () => {
    const input = JSON.parse(
      fs.readFileSync(path.join(GOLDEN_DIR, 'ringgroups.input.json'), 'utf8'),
    ) as GoldenInput;
    const expected = fs.readFileSync(path.join(GOLDEN_DIR, 'ringgroups.conf'), 'utf8');
    const actual = renderRingGroupDialplan(input.groups, { updatedAt: input.updatedAt });
    expect(actual).toBe(expected);
  });
});
