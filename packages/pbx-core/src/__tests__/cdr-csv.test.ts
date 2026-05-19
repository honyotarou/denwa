import { describe, expect, it } from 'vitest';
import { cdrRowFromCsvLine, parseCdrCsvLine } from '../cdr/csv.js';

describe('CDR CSV 1 行パース', () => {
  it('Given クォート内カンマ When parse Then フィールドが分割されない', () => {
    expect(parseCdrCsvLine('"a,b",c')).toEqual(['a,b', 'c']);
  });

  it('Given エスケープされた二重引用符 When parse Then 1 フィールドに復元', () => {
    expect(parseCdrCsvLine('"say ""hi""",x')).toEqual(['say "hi"', 'x']);
  });

  it('Given Asterisk 形式の 18 フィールド When cdrRowFromCsvLine Then uniqueid が取れる', () => {
    const line =
      '"","1001","9000","internal","","","","Dial","","t1","t2","t3","60","55","ANSWERED","","","uid-1"';
    const row = cdrRowFromCsvLine(line);
    expect(row).not.toBeNull();
    expect(row!.src).toBe('1001');
    expect(row!.dst).toBe('9000');
    expect(row!.uniqueid).toBe('uid-1');
    expect(row!.disposition).toBe('ANSWERED');
  });

  it('Given フィールド不足 When cdrRowFromCsvLine Then null', () => {
    expect(cdrRowFromCsvLine('a,b,c')).toBeNull();
  });
});
