import { describe, expect, it } from 'vitest';
import { normalizeExtensionDraft, toExtensionDraft } from '../extension.js';
import { renderPjsipExtensions } from '../pjsip.js';

describe('PJSIP 設定の生成', () => {
  const draft = (input: Parameters<typeof normalizeExtensionDraft>[0]) =>
    toExtensionDraft(normalizeExtensionDraft(input));

  it('Given 内線 1001 When render Then endpoint と auth ブロックが含まれる', () => {
    const out = renderPjsipExtensions(
      [
        draft({
          number: '1001',
          displayName: 'Reception',
          secret: 'secret-1001',
          webrtc: false,
          pickupGroupNames: [],
        }),
      ],
      { updatedAt: '2026-05-19T00:00:00.000Z' },
    );
    expect(out).toContain('[1001](endpoint-internal)');
    expect(out).toContain('[auth1001](auth-userpass)');
    expect(out).toContain('password=secret-1001');
    expect(out).toContain('callerid="Reception" <1001>');
  });

  it('Given WebRTC 有効 When render Then webrtc テンプレート', () => {
    const out = renderPjsipExtensions(
      [
        draft({
          number: '1002',
          displayName: null,
          secret: 'x',
          webrtc: true,
          pickupGroupNames: [],
        }),
      ],
      { updatedAt: 'fixed' },
    );
    expect(out).toContain('[1002](endpoint-webrtc)');
  });

  it('Given ピックアップグループ When render Then named_call_group が付く', () => {
    const out = renderPjsipExtensions(
      [
        draft({
          number: '1001',
          displayName: null,
          secret: 'x',
          webrtc: false,
          pickupGroupNames: ['front', 'back'],
        }),
      ],
      { updatedAt: 'fixed' },
    );
    expect(out).toContain('named_call_group=front,back');
  });
});
