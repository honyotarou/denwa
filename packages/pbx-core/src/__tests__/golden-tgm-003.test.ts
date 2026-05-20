import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderPickupDialplan } from '../pickup/dialplan.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN_DIR = path.join(ROOT, 'fixtures/golden/current/dialplan');

type GoldenInput = {
  updatedAt: string;
};

describe('T-GM-003: golden dialplan/pickup.conf', () => {
  it('Given 固定時刻 When renderPickupDialplan Then *8 Pickup と golden 一致', () => {
    const input = JSON.parse(
      fs.readFileSync(path.join(GOLDEN_DIR, 'pickup.input.json'), 'utf8'),
    ) as GoldenInput;
    const expected = fs.readFileSync(path.join(GOLDEN_DIR, 'pickup.conf'), 'utf8');
    const actual = renderPickupDialplan({ updatedAt: input.updatedAt });
    expect(actual).toBe(expected);
  });
});
