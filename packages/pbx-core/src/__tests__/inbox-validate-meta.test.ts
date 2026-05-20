import { describe, expect, it } from 'vitest';
import { buildInboxMeta } from '../inbox/meta.js';
import { buildInboxMetaIntegrity } from '../inbox/hmac.js';
import {
  validateInboxMetaForIngest,
  validateInboxMetaShape,
  validateInboxMetaShapeLoose,
} from '../inbox/validate-meta.js';

describe('T-SEC-INBOX-001: inbox meta field safety (F-009)', () => {
  it('Given shell chars in callerName When validate Then false', () => {
    expect(
      validateInboxMetaShape({
        schema: 'command-room-pbx/v1',
        source: 'asterisk',
        kind: 'callback_request',
        extension: '9002',
        callerId: '1001',
        callerName: '";id;',
        uniqueId: 'u1',
        recordingFile: 'a.wav',
        receivedAt: '2026-01-01T00:00:00Z',
      }),
    ).toBe(false);
  });

  it('Given empty recordingFile When validate Then true (T-INBOX-003)', () => {
    expect(
      validateInboxMetaShapeLoose({
        schema: 'command-room-pbx/v1',
        source: 'asterisk',
        kind: 'callback_request',
        extension: '9002',
        callerId: '1002',
        callerName: 'Caller',
        uniqueId: '1700000000.2',
        recordingFile: '',
        receivedAt: '2026-05-20T08:15:17Z',
      }),
    ).toBe(true);
  });

  it('T-SEC-INBOX-002: Given hmac secret When unsigned meta Then ingest rejects', () => {
    const meta = buildInboxMeta({
      kind: 'callback_request',
      extension: '9002',
      callerId: '1001',
      callerName: 'Desk',
      uniqueId: 'u1',
      recordingFile: 'a.wav',
      receivedAt: '2026-01-01T00:00:00Z',
    });
    expect(validateInboxMetaForIngest(meta, 'prod-secret')).toBe(false);
    const signed = { ...meta, integrity: buildInboxMetaIntegrity(meta, 'prod-secret') };
    expect(validateInboxMetaForIngest(signed, 'prod-secret')).toBe(true);
  });
});
