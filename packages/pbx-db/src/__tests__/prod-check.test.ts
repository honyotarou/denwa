import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { applySchema } from '../apply-schema.js';
import { hashPassword } from '@openpbx/core';
import { runProdCheckDatabase } from '../prod-check.js';

describe('T-PROD-001 / T-PROD-007 database prod check', () => {
  it('Given seeded admin When check Then T-PROD-001 fails', () => {
    const db = new Database(':memory:');
    applySchema(db);
    db.prepare(
      `INSERT INTO accounts (username, display_name, role, password_hash) VALUES ('admin', 'Admin', 'admin', ?)`,
    ).run(hashPassword('admin-please-change'));
    const findings = runProdCheckDatabase(db);
    expect(findings.find((f) => f.id === 'T-PROD-001')?.severity).toBe('fail');
    db.close();
  });

  it('Given rotated admin When check Then T-PROD-001 passes', () => {
    const db = new Database(':memory:');
    applySchema(db);
    db.prepare(
      `INSERT INTO accounts (username, display_name, role, password_hash) VALUES ('admin', 'Admin', 'admin', ?)`,
    ).run(hashPassword('rotated-secret-value'));
    const findings = runProdCheckDatabase(db);
    expect(findings.find((f) => f.id === 'T-PROD-001')?.severity).toBe('pass');
    db.close();
  });

  it('Given empty ip_allow When check Then T-PROD-007 fails', () => {
    const db = new Database(':memory:');
    applySchema(db);
    const findings = runProdCheckDatabase(db);
    expect(findings.find((f) => f.id === 'T-PROD-007')?.severity).toBe('fail');
    db.close();
  });
});
