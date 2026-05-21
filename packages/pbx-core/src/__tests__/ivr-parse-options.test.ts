import { describe, expect, it } from 'vitest';
import { parseIvrOptionsText } from '../ivr/parse-options.js';

describe('parseIvrOptionsText', () => {
  it('Given 改行区切り When parse Then 各 option', () => {
    const opts = parseIvrOptionsText(
      '1|goto_extension|9001|当日\n2|goto_ringgroup|6000|G\n0|hangup||',
    );
    expect(opts).toEqual([
      { digit: '1', action: 'goto_extension', target: '9001', label: '当日' },
      { digit: '2', action: 'goto_ringgroup', target: '6000', label: 'G' },
      { digit: '0', action: 'hangup', target: null, label: null },
    ]);
  });

  it('Given 空行 When parse Then スキップ', () => {
    expect(parseIvrOptionsText('\n\n')).toEqual([]);
  });
});
