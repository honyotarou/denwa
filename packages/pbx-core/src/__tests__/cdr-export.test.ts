import { describe, expect, it } from 'vitest';
import { escapeCsvCell, renderCdrExportCsv } from '../cdr/export.js';

describe('T-SEC-CSV-001: CDR export formula injection', () => {
  it('Given =cmd prefix When escapeCsvCell Then quoted with leading single quote', () => {
    expect(escapeCsvCell('=cmd|calc')).toBe("'=cmd|calc");
  });

  it('Given safe value When renderCdrExportCsv Then header and row', () => {
    const csv = renderCdrExportCsv([
      {
        uniqueid: 'u1',
        startTime: '2026-01-01',
        src: '1001',
        dst: '1002',
        billsec: '30',
        disposition: 'ANSWERED',
      },
    ]);
    expect(csv).toContain('uniqueid,startTime');
    expect(csv).toContain('u1');
    expect(csv).not.toMatch(/^=cmd/m);
  });
});
