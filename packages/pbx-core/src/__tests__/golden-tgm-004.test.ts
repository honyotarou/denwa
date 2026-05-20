import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderIvrDialplan } from '../ivr/dialplan.js';
import type { IvrMenuDraftInput } from '../ivr/types.js';
import { toIvrMenuDraft } from '../ivr/validate.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN_DIR = path.join(ROOT, 'fixtures/golden/current/dialplan');

type GoldenInput = {
  updatedAt: string;
  menus: IvrMenuDraftInput[];
};

describe('T-GM-004: golden dialplan/ivr.conf', () => {
  it('Given IVR メニュー 5000 When renderIvrDialplan Then golden と一致', () => {
    const input = JSON.parse(
      fs.readFileSync(path.join(GOLDEN_DIR, 'ivr.input.json'), 'utf8'),
    ) as GoldenInput;
    const expected = fs.readFileSync(path.join(GOLDEN_DIR, 'ivr.conf'), 'utf8');
    const menus = input.menus.map((m) => toIvrMenuDraft(m));
    const actual = renderIvrDialplan(menus, { updatedAt: input.updatedAt });
    expect(actual).toBe(expected);
  });
});
