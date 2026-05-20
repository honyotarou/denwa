import { describe, expect, it } from 'vitest';
import { filterDueUpgrades, formatUpgradeRunCommands } from '../upgrade/due.js';
import { enrichCdrRowsForUi } from '../cdr/ui-row.js';

describe('upgrade due + CDR UI', () => {
  it('T-UPG-002: filterDueUpgrades returns past schedules', () => {
    const rows = [
      { id: 1, scheduledAt: '2026-01-01T00:00:00Z', asteriskImage: 'v1' },
      { id: 2, scheduledAt: '2030-01-01T00:00:00Z', asteriskImage: 'v2' },
    ];
    const due = filterDueUpgrades(rows, '2026-06-01T00:00:00Z');
    expect(due.map((r) => r.id)).toEqual([1]);
  });

  it('T-UPG-003: formatUpgradeRunCommands includes image tag', () => {
    const cmds = formatUpgradeRunCommands({
      id: 1,
      scheduledAt: '2026-01-01T00:00:00Z',
      asteriskImage: 'cr.example/ast:1.2',
    });
    expect(cmds.join('\n')).toContain('cr.example/ast:1.2');
  });

  it('T-CDR-UI-001: enrichCdrRowsForUi applies billing prefix', () => {
    const out = enrichCdrRowsForUi(
      [{ uniqueid: 'u1', startTime: null, src: '1001', dst: '0312345678', billsec: 60, disposition: 'ANSWERED' }],
      [{ prefix: '03', perMin: 6, setupFee: 2 }],
    );
    expect(out[0]!.cost).toBe(8);
    expect(out[0]!.ratePrefix).toBe('03');
  });
});
