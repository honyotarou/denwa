import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { normalizeDockerCompose, type ComposeDraft } from '../docker/compose.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN_DIR = path.join(ROOT, 'fixtures/golden/current/docker');

describe('T-GM-009: golden docker/compose-normalized.json', () => {
  it('Given legacy compose 契約 When normalizeDockerCompose Then golden と一致', () => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(GOLDEN_DIR, 'compose.input.json'), 'utf8'),
    ) as ComposeDraft & { id: string };
    const { id: _id, ...draft } = raw;
    const expected = JSON.parse(
      fs.readFileSync(path.join(GOLDEN_DIR, 'compose-normalized.json'), 'utf8'),
    );
    expect(normalizeDockerCompose(draft)).toEqual(expected);
  });
});
