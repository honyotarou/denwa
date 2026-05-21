import { describe, expect, it } from 'vitest';
import { normalizeTrunkDraft } from '../trunk/normalize.js';

describe('T-TRUNK-001: normalizeTrunkDraft', () => {
  it('Given OpenPBX 相当入力 When normalize Then TrunkDraft', () => {
    expect(
      normalizeTrunkDraft({
        name: ' carrier-a ',
        host: ' sip.example.com ',
        port: 5060,
        username: 'user',
        secret: 'pass',
        registration: true,
        fromUser: '050',
        fromDomain: 'example.com',
        didInbound: '0312345678',
        outboundPrefix: '0',
        note: 'memo',
      }),
    ).toEqual({
      name: 'carrier-a',
      host: 'sip.example.com',
      port: 5060,
      username: 'user',
      secret: 'pass',
      registration: true,
      fromUser: '050',
      fromDomain: 'example.com',
      didInbound: '0312345678',
      outboundPrefix: '0',
    });
  });

  it('Given 空 optional When normalize Then null / default port', () => {
    expect(
      normalizeTrunkDraft({
        name: 't1',
        host: 'h.example.com',
        username: '',
        secret: '',
        registration: false,
      }),
    ).toEqual({
      name: 't1',
      host: 'h.example.com',
      port: 5060,
      username: null,
      secret: null,
      registration: false,
      fromUser: null,
      fromDomain: null,
      didInbound: null,
      outboundPrefix: null,
    });
  });
});
