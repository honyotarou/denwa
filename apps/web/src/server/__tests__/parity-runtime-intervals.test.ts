import { describe, expect, it, vi, afterEach } from 'vitest';
import { resolveCdrPollIntervalMs, resolveConcurrencyPollIntervalMs } from '@openpbx/core';

describe('T-POLL-RUNTIME-001: background interval wiring', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('Given custom CDR_POLL_INTERVAL_MS When resolve Then used by periodic module', () => {
    vi.stubEnv('CDR_POLL_INTERVAL_MS', '15000');
    expect(resolveCdrPollIntervalMs()).toBe(15_000);
  });

  it('Given custom CONCURRENCY_POLL_INTERVAL_MS When resolve Then 30s default overridden', () => {
    vi.stubEnv('CONCURRENCY_POLL_INTERVAL_MS', '45000');
    expect(resolveConcurrencyPollIntervalMs()).toBe(45_000);
  });
});
