import { describe, expect, it } from 'vitest';
import { normalizeCdrListFilter } from '../cdr/filter.js';
import { cdrRecordUpsertFromParsed } from '../cdr/record-input.js';
import { buildBillingDetailRows, sumBillingCosts } from '../billing/detail-rows.js';
import { resolveCdrPollIntervalMs, resolveConcurrencyPollIntervalMs } from '../runtime/poll-intervals.js';
import { barHeightPercent } from '../concurrency/chart.js';
import { summarizeDeviceOnline } from '../home/device-summary.js';

describe('T-CDR-FILT-001: normalizeCdrListFilter', () => {
  it('Given limit above max When normalize Then capped at 1000', () => {
    expect(normalizeCdrListFilter({ limit: 9999 }).limit).toBe(1000);
  });

  it('Given limit below 1 When normalize Then floored at 1', () => {
    expect(normalizeCdrListFilter({ limit: 0 }).limit).toBe(1);
  });

  it('Given whitespace fields When normalize Then trimmed or omitted', () => {
    const f = normalizeCdrListFilter({ src: ' 1001 ', disposition: '   ' });
    expect(f.src).toBe('1001');
    expect(f.disposition).toBeUndefined();
    expect(normalizeCdrListFilter({}).limit).toBe(200);
  });

  it('Given from/to/dst When normalize Then trimmed', () => {
    const f = normalizeCdrListFilter({
      from: ' 2026-01-01 ',
      to: ' 2026-12-31 ',
      dst: ' 03 ',
    });
    expect(f.from).toBe('2026-01-01');
    expect(f.to).toBe('2026-12-31');
    expect(f.dst).toBe('03');
  });
});

describe('T-CDR-REC-001: cdrRecordUpsertFromParsed', () => {
  it('Given parsed row When map Then DB-shaped fields', () => {
    const row = cdrRecordUpsertFromParsed({
      uniqueid: '1.0',
      src: '1001',
      dst: '1002',
      dcontext: 'internal',
      clid: '',
      channel: 'PJSIP/1001',
      dstchannel: 'PJSIP/1002',
      lastapp: 'Dial',
      lastdata: '',
      start: '2026-05-20 10:00:00',
      answer: '',
      end: '2026-05-20 10:01:00',
      durationSec: 60,
      billsecSec: 55,
      disposition: 'ANSWERED',
      amaflag: '',
      accountcode: '',
      userfield: '',
    });
    expect(row.startAt).toBe('2026-05-20 10:00:00');
    expect(row.billsec).toBe(55);
    expect(row.clid).toBeNull();
  });

  it('Given non-empty optional fields When map Then kept', () => {
    const row = cdrRecordUpsertFromParsed({
      uniqueid: '2.0',
      src: 'a',
      dst: 'b',
      dcontext: 'ctx',
      clid: 'caller',
      channel: 'ch',
      dstchannel: 'dch',
      lastapp: 'app',
      lastdata: 'data',
      start: '2026-05-20 10:00:00',
      answer: '2026-05-20 10:00:05',
      end: '2026-05-20 10:01:00',
      durationSec: 60,
      billsecSec: 55,
      disposition: 'ANSWERED',
      amaflag: 'BILL',
      accountcode: 'acc',
      userfield: 'uf',
    });
    expect(row.clid).toBe('caller');
    expect(row.dcontext).toBe('ctx');
    expect(row.answerAt).toBe('2026-05-20 10:00:05');
    expect(row.amaflag).toBe('BILL');
    expect(row.accountcode).toBe('acc');
    expect(row.userfield).toBe('uf');
  });

  it('Given empty strings When map Then null for optional text fields', () => {
    const row = cdrRecordUpsertFromParsed({
      uniqueid: '3.0',
      src: '',
      dst: '',
      dcontext: '',
      clid: '',
      channel: '',
      dstchannel: '',
      lastapp: '',
      lastdata: '',
      start: null,
      answer: null,
      end: null,
      durationSec: 0,
      billsecSec: 0,
      disposition: '',
      amaflag: '',
      accountcode: '',
      userfield: '',
    });
    expect(row.src).toBeNull();
    expect(row.dst).toBeNull();
    expect(row.disposition).toBeNull();
    expect(row.channel).toBeNull();
  });
});

describe('T-BILL-DET-001: billing detail rows', () => {
  const rates = [{ prefix: '03', perMin: 3, setupFee: 0 }] as const;

  it('Given billable dst When build Then cost > 0', () => {
    const rows = buildBillingDetailRows(
      [{ uniqueid: 'u1', src: '1001', dst: '031234', startAt: '2026-01-01', billsec: 60 }],
      rates,
    );
    expect(rows[0]!.cost).toBeGreaterThan(0);
    expect(sumBillingCosts(rows)).toBe(rows[0]!.cost);
  });

  it('Given no matching rate When build Then cost 0', () => {
    const rows = buildBillingDetailRows(
      [{ uniqueid: 'u2', src: '1', dst: '999', startAt: null, billsec: 60 }],
      rates,
    );
    expect(rows[0]!.cost).toBe(0);
    expect(rows[0]!.ratePrefix).toBeNull();
  });

  it('Given multiple rows When sum Then rounded total', () => {
    const rows = buildBillingDetailRows(
      [
        { uniqueid: 'a', src: null, dst: '031', startAt: null, billsec: 60 },
        { uniqueid: 'b', src: null, dst: '031', startAt: null, billsec: 60 },
      ],
      rates,
    );
    expect(sumBillingCosts(rows)).toBe(Math.round((rows[0]!.cost + rows[1]!.cost) * 100) / 100);
  });
});

describe('T-POLL-001: poll interval env', () => {
  it('Given defaults When resolve Then 10s / 30s', () => {
    expect(resolveCdrPollIntervalMs({})).toBe(10_000);
    expect(resolveConcurrencyPollIntervalMs({})).toBe(30_000);
  });

  it('Given valid env When resolve Then parsed ms', () => {
    expect(resolveCdrPollIntervalMs({ CDR_POLL_INTERVAL_MS: '5000' })).toBe(5000);
    expect(resolveConcurrencyPollIntervalMs({ CONCURRENCY_POLL_INTERVAL_MS: '60000' })).toBe(60_000);
  });

  it('Given invalid or too small env When resolve Then defaults', () => {
    expect(resolveCdrPollIntervalMs({ CDR_POLL_INTERVAL_MS: 'nope' })).toBe(10_000);
    expect(resolveCdrPollIntervalMs({ CDR_POLL_INTERVAL_MS: '500' })).toBe(10_000);
    expect(resolveConcurrencyPollIntervalMs({ CONCURRENCY_POLL_INTERVAL_MS: '1000' })).toBe(30_000);
  });
});

describe('T-CONC-CHART-001: barHeightPercent', () => {
  it('Given zero channels When bar Then minimum 2%', () => {
    expect(barHeightPercent(0, 10)).toBe(2);
  });

  it('Given max channels When bar Then 100%', () => {
    expect(barHeightPercent(10, 10)).toBe(100);
  });

  it('Given empty max When bar Then uses max 1', () => {
    expect(barHeightPercent(0, 0)).toBe(2);
  });
});

describe('T-HOME-DEV-001: summarizeDeviceOnline', () => {
  it('Given mixed reachability When summarize Then counts PJSIP extensions only', () => {
    const { online, total } = summarizeDeviceOnline([
      { extension: '1001', reachable: true, state: 'not_inuse' },
      { extension: '1002', reachable: false, state: 'unavailable' },
      { extension: null, reachable: null, state: 'unknown' },
    ]);
    expect(total).toBe(2);
    expect(online).toBe(1);
  });

  it('Given inuse state When summarize Then counts online', () => {
    const { online, total } = summarizeDeviceOnline([
      { extension: '1001', reachable: false, state: 'inuse' },
    ]);
    expect(total).toBe(1);
    expect(online).toBe(1);
  });

  it('Given no extensions When summarize Then zero', () => {
    expect(summarizeDeviceOnline([])).toEqual({ online: 0, total: 0 });
  });
});
