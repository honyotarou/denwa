import { describe, expect, it } from 'vitest';
import { normalizePhonebookNumber, validatePhonebookDraft } from '../phonebook/validate.js';

describe('電話帳', () => {
  it('Given 括弧付き番号 When normalize Then 数字のみ', () => {
    expect(normalizePhonebookNumber('03 (1234) 5678')).toBe('0312345678');
  });

  it('Given 正常エントリ When validate Then 空', () => {
    expect(validatePhonebookDraft({ name: '田中', number: '+81-3-1234' })).toEqual([]);
  });

  it('Given 空名前 When validate Then エラー', () => {
    expect(validatePhonebookDraft({ name: ' ', number: '1001' })).toContain('名前は必須');
  });
});
