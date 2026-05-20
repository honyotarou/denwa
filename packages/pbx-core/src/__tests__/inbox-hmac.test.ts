import { describe, expect, it } from 'vitest';
import { buildInboxMeta, type InboxMeta } from '../inbox/meta.js';
import {
  buildInboxMetaIntegrity,
  computeInboxMetaHmac,
  inboxMetaCanonicalJson,
  verifyInboxMetaIntegrity,
} from '../inbox/hmac.js';

const sample = (): InboxMeta =>
  buildInboxMeta({
    kind: 'same_day_reservation',
    extension: '9001',
    callerId: '+819011111111',
    callerName: 'Desk 1001',
    uniqueId: 'u-001',
    recordingFile: 'rec.wav',
    receivedAt: '2026-05-20T00:00:00Z',
  });

describe('T-SEC-INBOX-002: inbox meta HMAC (F-009)', () => {
  it('Given meta When canonicalJson Then stable key order', () => {
    const m = sample();
    expect(inboxMetaCanonicalJson(m)).toBe(
      '{"schema":"command-room-pbx/v1","source":"asterisk","kind":"same_day_reservation","extension":"9001","callerId":"+819011111111","callerName":"Desk 1001","uniqueId":"u-001","recordingFile":"rec.wav","receivedAt":"2026-05-20T00:00:00Z"}',
    );
  });

  it('Given secret When compute hmac Then verify passes', () => {
    const m = sample();
    const secret = 'test-inbox-hmac-secret';
    const integrity = buildInboxMetaIntegrity(m, secret);
    expect(verifyInboxMetaIntegrity({ ...m, integrity }, secret)).toBe(true);
    expect(verifyInboxMetaIntegrity({ ...m, integrity }, 'wrong')).toBe(false);
  });

  it('Given tampered callerId When verify Then fails', () => {
    const m = sample();
    const secret = 'test-inbox-hmac-secret';
    const integrity = buildInboxMetaIntegrity(m, secret);
    const tampered = { ...m, callerId: '+819099999999', integrity };
    expect(verifyInboxMetaIntegrity(tampered, secret)).toBe(false);
  });

  it('Given empty secret When verify Then allow unsigned (dev)', () => {
    const m = sample();
    expect(verifyInboxMetaIntegrity(m, '')).toBe(true);
    expect(computeInboxMetaHmac(m, '')).toBe('');
  });
});
