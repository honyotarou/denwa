import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildInboxMeta, type BuildInboxMetaInput } from '../inbox/meta.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN_DIR = path.join(ROOT, 'fixtures/golden/current/inbox');

describe('T-GM-008: golden inbox/meta.json', () => {
  it('Given notify-event 相当入力 When buildInboxMeta Then golden と一致', () => {
    const input = JSON.parse(
      fs.readFileSync(path.join(GOLDEN_DIR, 'meta.input.json'), 'utf8'),
    ) as BuildInboxMetaInput & { id: string };
    const { id: _id, ...metaInput } = input;
    const expected = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, 'meta.json'), 'utf8'));
    expect(buildInboxMeta(metaInput)).toEqual(expected);
  });
});
