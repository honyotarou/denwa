import { describe, expect, it, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { applySchema } from '../apply-schema.js';
import { createExtension } from '../repos/extensions.js';
import { createPickupGroup } from '../repos/pickup-groups.js';
import { listPickupGroupNamesByExtension } from '../repos/extension-pickup-groups.js';

describe('extension pickup group names', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    applySchema(db);
    createExtension(db, { number: '1001', secret: 's1' });
    createExtension(db, { number: '1002', secret: 's2' });
    createPickupGroup(db, 'front', ['1001', '1002']);
    createPickupGroup(db, 'back', ['1002']);
  });

  it('Given members When listPickupGroupNamesByExtension Then per-extension groups', () => {
    const map = listPickupGroupNamesByExtension(db);
    expect(map.get('1001')).toEqual(['front']);
    expect(map.get('1002')).toEqual(['back', 'front']);
    expect(map.get('1003')).toBeUndefined();
  });
});
