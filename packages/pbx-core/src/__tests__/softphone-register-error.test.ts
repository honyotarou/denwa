import { describe, expect, it } from 'vitest';
import { classifySipRegisterFailure } from '../softphone/register-error.js';

describe('classifySipRegisterFailure (T-SOFT-007)', () => {
  it('classifies TLS/cert errors', () => {
    expect(classifySipRegisterFailure('NET::ERR_CERT_AUTHORITY_INVALID').kind).toBe('cert');
    expect(classifySipRegisterFailure('self-signed certificate').kind).toBe('cert');
  });

  it('classifies CSP blocks', () => {
    expect(classifySipRegisterFailure('Refused to connect: content-security-policy').kind).toBe(
      'wss',
    );
  });

  it('classifies WSS/network errors', () => {
    expect(classifySipRegisterFailure('WebSocket connection failed').kind).toBe('wss');
    expect(classifySipRegisterFailure('ECONNREFUSED 8089').kind).toBe('wss');
  });

  it('classifies auth errors', () => {
    expect(classifySipRegisterFailure('401 Unauthorized').kind).toBe('auth');
    expect(classifySipRegisterFailure('wrong password digest').kind).toBe('auth');
  });

  it('classifies media permission errors', () => {
    expect(classifySipRegisterFailure('NotAllowedError getUserMedia').kind).toBe('media');
  });

  it('falls back to unknown with raw message', () => {
    const r = classifySipRegisterFailure('something odd');
    expect(r.kind).toBe('unknown');
    expect(r.userMessage).toBe('something odd');
  });

  it('empty raw → generic message', () => {
    expect(classifySipRegisterFailure('').userMessage).toMatch(/SIP 登録に失敗/);
  });
});
