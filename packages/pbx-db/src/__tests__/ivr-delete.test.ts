import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { applySchema } from '../apply-schema.js';
import { createIvrMenu, deleteIvrMenu, getIvrMenu } from '../repos/ivr.js';

describe('deleteIvrMenu', () => {
  it('Given menu When delete Then removed', () => {
    const db = new Database(':memory:');
    applySchema(db);
    createIvrMenu(db, {
      number: '8001',
      options: [{ digit: '1', action: 'goto_extension', target: '9001', label: null }],
    });
    expect(deleteIvrMenu(db, '8001')).toBe(true);
    expect(getIvrMenu(db, '8001')).toBeNull();
    db.close();
  });
});
