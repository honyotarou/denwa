import { describe, expect, it } from 'vitest';
import { createInMemoryDb, createAccount, createExtension } from '../index.js';
import { hashPassword } from '@openpbx/core';
import {
  grantExtensionToAccount,
  listGrantedExtensionNumbers,
  revokeExtensionGrant,
} from '../repos/account-extension-grants.js';
import {
  createClickToCallToken,
  listClickToCallTokens,
  revokeClickToCallToken,
  findActiveClickToCallTokenByHash,
} from '../repos/click-to-call-tokens.js';
import { hashClickToCallToken } from '@openpbx/core';

describe('gap repos', () => {
  it('T-SOFT grants: grant and list', () => {
    const db = createInMemoryDb();
    const acct = createAccount(db, {
      username: 'u1',
      passwordHash: hashPassword('pw'),
      role: 'user',
    });
    createExtension(db, { number: '1001', secret: 's', webrtc: true });
    grantExtensionToAccount(db, acct.id, '1001');
    expect(listGrantedExtensionNumbers(db, acct.id)).toEqual(['1001']);
    revokeExtensionGrant(db, acct.id, '1001');
    expect(listGrantedExtensionNumbers(db, acct.id)).toEqual([]);
  });

  it('T-CHX-011/012: token create and revoke', () => {
    const db = createInMemoryDb();
    const acct = createAccount(db, {
      username: 'u2',
      passwordHash: hashPassword('pw'),
    });
    const plain = 'test-token-plain';
    createClickToCallToken(db, {
      accountId: acct.id,
      name: 'ext',
      tokenHash: hashClickToCallToken(plain),
      fromExtension: '1001',
    });
    expect(listClickToCallTokens(db, acct.id)).toHaveLength(1);
    const row = findActiveClickToCallTokenByHash(db, hashClickToCallToken(plain));
    expect(row?.fromExtension).toBe('1001');
    revokeClickToCallToken(db, row!.id, acct.id);
    expect(findActiveClickToCallTokenByHash(db, hashClickToCallToken(plain))).toBeNull();
  });
});
