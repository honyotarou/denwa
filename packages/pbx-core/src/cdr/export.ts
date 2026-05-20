/** CDR CSV ダウンロード — Excel 数式インジェクション対策の単一正本 */

export type CdrExportRow = Readonly<{
  uniqueid: string;
  startTime: string;
  src: string;
  dst: string;
  billsec: string;
  disposition: string;
}>;

const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** セル値を CSV 安全化（=cmd| 等を無害化） */
export function escapeCsvCell(value: string): string {
  const v = value ?? '';
  const needsQuote = CSV_FORMULA_PREFIX.test(v) || v.includes(',') || v.includes('"') || v.includes('\n');
  const body = needsQuote && CSV_FORMULA_PREFIX.test(v) ? `'${v}` : v;
  if (body.includes('"') || body.includes(',') || body.includes('\n')) {
    return `"${body.replace(/"/g, '""')}"`;
  }
  return body;
}

export function renderCdrExportCsv(rows: readonly CdrExportRow[]): string {
  const headers = ['uniqueid', 'startTime', 'src', 'dst', 'billsec', 'disposition'] as const;
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        escapeCsvCell(r.uniqueid),
        escapeCsvCell(r.startTime),
        escapeCsvCell(r.src),
        escapeCsvCell(r.dst),
        escapeCsvCell(r.billsec),
        escapeCsvCell(r.disposition),
      ].join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}
