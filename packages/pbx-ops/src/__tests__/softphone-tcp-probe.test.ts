import { describe, expect, it } from 'vitest';
import { probeTcpPort } from '../softphone/tcp-probe.js';

describe('probeTcpPort (G4b)', () => {
  it('Given closed port When probe Then not ok', async () => {
    const r = await probeTcpPort('127.0.0.1', 19, 300);
    expect(r.ok).toBe(false);
  });
});
