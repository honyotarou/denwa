import { describe, expect, it, vi } from 'vitest';
import { normalizeClickToCallNumber } from '../click2call/phone.js';
import {
  buildOriginateHttpRequest,
  normalizeClick2CallStorage,
  originateViaBearer,
} from '../click2call/originate-client.js';
import {
  CONTENT_SCAN_MAX_TEXT_NODES,
  extractTelDigitsFromHref,
  replacePhoneTextWithTelLinks,
  shouldStopContentScan,
  shouldDecoratePhoneText,
  splitTextIntoPhoneSegments,
} from '../click2call/content-scan.js';
import { classifySipRegisterFailure } from '../softphone/register-error.js';
import { buildSipJsTransportOptions, buildWssTransportUrl } from '../softphone/wss.js';

describe('T-CHX L5 contracts', () => {
  it('T-CHX-002: +81 domestic', () => {
    expect(normalizeClickToCallNumber('+81 3 1234 5678')).toBe('0312345678');
  });

  it('T-CHX-003: invalid', () => {
    expect(normalizeClickToCallNumber('not a phone')).toBeNull();
  });

  it('T-CHX-004: decorate text', () => {
    const out = replacePhoneTextWithTelLinks('電話 03-1234-5678 へ');
    expect(out).toContain('href="tel:0312345678"');
  });

  it('T-CHX-004b: HTML in text is escaped', () => {
    const out = replacePhoneTextWithTelLinks('<img src=x onerror=alert(1)>');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });

  it('T-CHX-004c: splitTextIntoPhoneSegments preserves literal HTML', () => {
    const segs = splitTextIntoPhoneSegments('note <b>x</b> 03-1234-5678');
    expect(segs.some((s) => s.kind === 'text' && s.value.includes('<b>'))).toBe(true);
    expect(segs.some((s) => s.kind === 'phone')).toBe(true);
  });

  it('T-CHX-005: scan limit', () => {
    expect(shouldStopContentScan(CONTENT_SCAN_MAX_TEXT_NODES)).toBe(false);
    expect(shouldStopContentScan(CONTENT_SCAN_MAX_TEXT_NODES + 1)).toBe(true);
  });

  it('T-CHX-005b: skip tel link innards', () => {
    expect(shouldDecoratePhoneText(true, 'A')).toBe(false);
    expect(shouldDecoratePhoneText(false, 'P')).toBe(true);
    expect(shouldDecoratePhoneText(false, 'SCRIPT')).toBe(false);
  });

  it('T-CHX-007: options storage', () => {
    expect(normalizeClick2CallStorage({ token: '' }).ok).toBe(false);
    const ok = normalizeClick2CallStorage({
      baseUrl: 'http://localhost:3000/',
      from: '1001',
      token: 'tok',
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.config.baseUrl).toBe('http://localhost:3000');
  });

  it('T-CHX-008: bearer POST shape', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    await originateViaBearer(
      { baseUrl: 'http://localhost:3000', from: '1001', token: 'abc' },
      '0312345678',
      fetchFn,
    );
    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:3000/api/originate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer abc' }),
      }),
    );
  });

  it('T-CHX-009: 401 user error', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    await expect(
      originateViaBearer({ token: 'x', from: '1001', baseUrl: 'http://x' }, '03', fetchFn),
    ).rejects.toThrow(/unauthorized/i);
  });

  it('tel href extract', () => {
    expect(extractTelDigitsFromHref('tel:03-1234-5678')).toBe('0312345678');
  });

  it('buildOriginateHttpRequest uses normalized to', () => {
    const { init } = buildOriginateHttpRequest(
      { baseUrl: 'http://h', from: '1001', token: 't' },
      'tel:03-1234-5678',
    );
    expect(JSON.parse(String(init.body))).toEqual({ from: '1001', to: '0312345678' });
  });
});

describe('T-SOFT L5 runtime', () => {
  it('T-SOFT-016: WSS URL', () => {
    expect(buildWssTransportUrl('pbx.local')).toBe('wss://pbx.local:8089/ws');
  });

  it('T-SOFT-017: sip.js transport options include timeout', () => {
    expect(buildSipJsTransportOptions('localhost')).toEqual({
      server: 'wss://localhost:8089/ws',
      connectionTimeout: 5,
    });
  });

  it('cert error classification', () => {
    expect(classifySipRegisterFailure('NET::ERR_CERT_AUTHORITY_INVALID').kind).toBe('cert');
  });

  it('wss error classification', () => {
    expect(classifySipRegisterFailure('WebSocket connection failed').kind).toBe('wss');
  });
});
