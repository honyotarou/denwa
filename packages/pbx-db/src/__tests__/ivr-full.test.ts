import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { applySchema } from '../apply-schema.js';
import { createIvrMenu, getIvrMenu, updateIvrMenu } from '../repos/ivr.js';
import { listIvrMenuDrafts } from '../repos/infra-load.js';

describe('IVR full fields', () => {
  it('Given prompts When create Then persisted and infra-load round-trips', () => {
    const db = new Database(':memory:');
    applySchema(db);
    createIvrMenu(db, {
      number: '9000',
      name: 'Main',
      welcomePrompt: 'custom/welcome',
      menuPrompt: 'custom/menu',
      invalidPrompt: 'custom/invalid',
      goodbyePrompt: 'custom/bye',
      maxRetries: 5,
      waitSeconds: 10,
      options: [{ digit: '1', action: 'goto_extension', target: '1001', label: '内線' }],
    });
    const row = getIvrMenu(db, '9000')!;
    expect(row.welcomePrompt).toBe('custom/welcome');
    expect(row.maxRetries).toBe(5);
    const [draft] = listIvrMenuDrafts(db);
    expect(draft!.welcomePrompt).toBe('custom/welcome');
    expect(draft!.maxRetries).toBe(5);
    db.close();
  });

  it('Given existing When update prompts Then merged', () => {
    const db = new Database(':memory:');
    applySchema(db);
    createIvrMenu(db, {
      number: '9000',
      welcomePrompt: 'a',
      options: [{ digit: '1', action: 'hangup', target: null, label: null }],
    });
    updateIvrMenu(db, {
      number: '9000',
      welcomePrompt: 'b',
      options: [{ digit: '1', action: 'hangup', target: null, label: null }],
    });
    expect(getIvrMenu(db, '9000')!.welcomePrompt).toBe('b');
    db.close();
  });
});
