import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderTrunksDialplan } from '../trunk/dialplan.js';
import type { TrunkDraft } from '../trunk/types.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN_DIR = path.join(ROOT, 'fixtures/golden/current/dialplan');

type GoldenInput = { updatedAt: string; trunks: TrunkDraft[] };

describe('T-GM-005: golden dialplan/trunks.conf', () => {
  it('Given DID と outboundPrefix When renderTrunksDialplan Then golden と一致', () => {
    const input = JSON.parse(
      fs.readFileSync(path.join(GOLDEN_DIR, 'trunks.input.json'), 'utf8'),
    ) as GoldenInput;
    const expected = fs.readFileSync(path.join(GOLDEN_DIR, 'trunks.conf'), 'utf8');
    expect(renderTrunksDialplan(input.trunks, { updatedAt: input.updatedAt })).toBe(expected);
  });
});
