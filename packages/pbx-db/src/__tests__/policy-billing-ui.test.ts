import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { applySchema } from '../apply-schema.js';
import { getPasswordPolicy, updatePasswordPolicy } from '../repos/policy.js';
import { listBillingRatesForUi, upsertBillingRate } from '../repos/billing.js';

describe('policy + billing UI rows', () => {
  it('Given schema When updatePasswordPolicy Then all columns', () => {
    const db = new Database(':memory:');
    applySchema(db);
    updatePasswordPolicy(db, {
      minLength: 10,
      requireLowercase: false,
      requireUppercase: true,
      requireDigit: false,
      requireSymbol: true,
      rotationDays: 90,
      lockoutThreshold: 3,
    });
    const p = getPasswordPolicy(db);
    expect(p.requireUppercase).toBe(true);
    expect(p.lockoutThreshold).toBe(3);
    db.close();
  });

  it('Given rate When listBillingRatesForUi Then label and setupFee', () => {
    const db = new Database(':memory:');
    applySchema(db);
    upsertBillingRate(db, { prefix: '03', label: '東京', perMin: 3, setupFee: 5 });
    expect(listBillingRatesForUi(db)).toEqual([
      { prefix: '03', label: '東京', perMin: 3, setupFee: 5 },
    ]);
    db.close();
  });
});
