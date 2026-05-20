import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cdrRowFromCsvLine } from '../cdr/csv.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN_DIR = path.join(ROOT, 'fixtures/golden/current/cdr');

describe('T-GM-007: golden cdr/master-row.csv + parsed.json', () => {
  it('Given Master.csv 1 行 When cdrRowFromCsvLine Then parsed.json と一致', () => {
    const line = fs.readFileSync(path.join(GOLDEN_DIR, 'master-row.csv'), 'utf8').trimEnd();
    const expected = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, 'parsed.json'), 'utf8'));
    expect(cdrRowFromCsvLine(line)).toEqual(expected);
  });
});
