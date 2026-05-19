import { describe, expect, it } from 'vitest';
import { assertDialplanFilename, validateDialplanFilename } from '../dialplan/filename.js';

describe('dialplan ファイル名', () => {
  it('Given ivr.conf When validate Then null', () => {
    expect(validateDialplanFilename('ivr.conf')).toBeNull();
  });

  it('Given パストラバーサル When validate Then エラー', () => {
    expect(validateDialplanFilename('../evil.conf')).not.toBeNull();
  });

  it('Given 不正名 When assert Then throw', () => {
    expect(() => assertDialplanFilename('bad name.conf')).toThrow(/invalid dialplan filename/);
  });
});
