import { describe, expect, it } from 'vitest';
import { cdrParsedRowFromCsvLine, cdrRowFromCsvLine, parseCdrCsvLine } from '../cdr/csv.js';

const SAMPLE_LINE =
  '"","1001","9000","internal","","","","Dial","","t1","t2","t3","60","55","ANSWERED","","","uid-1"';

describe('CDR CSV 1 行パース', () => {
  it('Given クォート内カンマ When parse Then フィールドが分割されない', () => {
    expect(parseCdrCsvLine('"a,b",c')).toEqual(['a,b', 'c']);
  });

  it('Given エスケープされた二重引用符 When parse Then 1 フィールドに復元', () => {
    expect(parseCdrCsvLine('"say ""hi""",x')).toEqual(['say "hi"', 'x']);
  });

  it('Given Asterisk 形式の 18 フィールド When cdrRowFromCsvLine Then uniqueid が取れる', () => {
    const row = cdrRowFromCsvLine(SAMPLE_LINE);
    expect(row).not.toBeNull();
    expect(row!.src).toBe('1001');
    expect(row!.dst).toBe('9000');
    expect(row!.uniqueid).toBe('uid-1');
    expect(row!.disposition).toBe('ANSWERED');
  });

  it('Given フィールド不足 When cdrRowFromCsvLine Then null', () => {
    expect(cdrRowFromCsvLine('a,b,c')).toBeNull();
  });

  it('Given 17 列（userfield 省略）When cdrRowFromCsvLine Then uniqueid と clid', () => {
    const line =
      '"","1001","1002","internal","""Reception 1001"" <1001>","PJSIP/1001-00000000","PJSIP/1002-00000001","Dial","PJSIP/1002,30","2026-05-20 20:25:28",,"2026-05-20 20:25:34",6,0,"NO ANSWER","DOCUMENTATION","1779308728.0"';
    const row = cdrRowFromCsvLine(line);
    expect(row).not.toBeNull();
    expect(row!.userfield).toBe('');
    expect(row!.uniqueid).toBe('1779308728.0');
    expect(row!.clid).toBe('"Reception 1001" <1001>');
    expect(row!.start).toBe('2026-05-20 20:25:28');
  });
});

describe('T-CDR-005: duration / billsec 数値化', () => {
  it('Given Master.csv 1 行 When cdrParsedRowFromCsvLine Then durationSec と billsecSec が数値', () => {
    const row = cdrParsedRowFromCsvLine(SAMPLE_LINE);
    expect(row).not.toBeNull();
    expect(row!.durationSec).toBe(60);
    expect(row!.billsecSec).toBe(55);
  });

  it('Given 非数値の秒 When cdrParsedRowFromCsvLine Then 0 として扱う', () => {
    const line =
      '"","1001","9000","internal","","","","Dial","","","","","x","y","ANSWERED","","","uid-2"';
    const row = cdrParsedRowFromCsvLine(line);
    expect(row!.durationSec).toBe(0);
    expect(row!.billsecSec).toBe(0);
  });
});

describe('T-CDR-006: 空日時', () => {
  it('Given 空の start/answer/end When cdrParsedRowFromCsvLine Then null', () => {
    const line =
      '"","1001","9000","internal","","","","Dial","","","","","0","0","NO ANSWER","","","uid-3"';
    const row = cdrParsedRowFromCsvLine(line);
    expect(row!.start).toBeNull();
    expect(row!.answer).toBeNull();
    expect(row!.end).toBeNull();
  });
});
