import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ExtensionDraft } from '../extension.js';
import { renderPjsipExtensions } from '../pjsip.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN_DIR = path.join(ROOT, 'fixtures/golden/current/pjsip');

type GoldenInput = {
  updatedAt: string;
  extensions: ExtensionDraft[];
};

describe('T-GM-001: golden pjsip/extensions.conf', () => {
  it('Given 内線 1001/1002 fixtures When renderPjsipExtensions Then golden と一致', () => {
    const input = JSON.parse(
      fs.readFileSync(path.join(GOLDEN_DIR, 'extensions.input.json'), 'utf8'),
    ) as GoldenInput;
    const expected = fs.readFileSync(path.join(GOLDEN_DIR, 'extensions.conf'), 'utf8');
    const actual = renderPjsipExtensions(input.extensions, { updatedAt: input.updatedAt });
    expect(actual).toBe(expected);
  });
});
