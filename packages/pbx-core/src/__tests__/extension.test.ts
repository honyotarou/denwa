import { describe, expect, it } from 'vitest';
import { validateExtensionDraft, validateExtensionNumber, validateExtensionSecret } from '../extension.js';

describe('内線番号の検証', () => {
  it('Given 2〜6 桁の数字 When 検証 Then エラーなし', () => {
    expect(validateExtensionNumber('1001')).toBeNull();
    expect(validateExtensionNumber('60001')).toBeNull();
  });

  it('Given 1 桁または 7 桁 When 検証 Then エラー', () => {
    expect(validateExtensionNumber('1')).not.toBeNull();
    expect(validateExtensionNumber('1234567')).not.toBeNull();
  });
});

describe('内線 secret の検証', () => {
  it('Given 4 文字以上の平文 When 検証 Then エラーなし', () => {
    expect(validateExtensionSecret('secret-1001')).toBeNull();
  });

  it('Given 引用符を含む When 検証 Then エラー', () => {
    expect(validateExtensionSecret('ab"c')).not.toBeNull();
  });
});

describe('内線ドラフト全体', () => {
  it('Given 正常なドラフト When validate Then 空配列', () => {
    expect(
      validateExtensionDraft({
        number: '1003',
        displayName: 'Nurse',
        secret: 's3cret',
        webrtc: false,
        pickupGroupNames: [],
      }),
    ).toEqual([]);
  });
});
