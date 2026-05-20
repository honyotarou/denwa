import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  renderBusinessHoursDialplan,
  type HolidayDraft,
  type TimeRuleDialplan,
} from '../business-hours/dialplan.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN_DIR = path.join(ROOT, 'fixtures/golden/current/dialplan');

type GoldenInput = {
  updatedAt: string;
  rules: TimeRuleDialplan[];
  holidays: HolidayDraft[];
};

describe('T-GM-006: golden dialplan/business-hours.conf', () => {
  it('Given 祝日と GotoIfTime When renderBusinessHoursDialplan Then golden と一致', () => {
    const input = JSON.parse(
      fs.readFileSync(path.join(GOLDEN_DIR, 'business-hours.input.json'), 'utf8'),
    ) as GoldenInput;
    const expected = fs.readFileSync(path.join(GOLDEN_DIR, 'business-hours.conf'), 'utf8');
    expect(
      renderBusinessHoursDialplan(input.rules, input.holidays, { updatedAt: input.updatedAt }),
    ).toBe(expected);
  });
});
