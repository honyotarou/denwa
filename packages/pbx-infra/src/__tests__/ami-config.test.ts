import { describe, expect, it } from 'vitest';
import { amiConfigFromEnv, assertAmiConfigReady } from '../ami/config.js';

describe('AMI config', () => {
  it('T-API-009: reads env fields', () => {
    const cfg = amiConfigFromEnv({
      AMI_HOST: '10.0.0.1',
      AMI_PORT: '5039',
      AMI_USERNAME: 'u',
      AMI_SECRET: 'sec',
      AMI_TIMEOUT_MS: '5000',
    });
    expect(cfg).toEqual({
      host: '10.0.0.1',
      port: 5039,
      username: 'u',
      secret: 'sec',
      timeoutMs: 5000,
    });
  });

  it('requires secret before originate', () => {
    expect(assertAmiConfigReady(amiConfigFromEnv({}))).toMatch(/AMI_SECRET/);
    expect(
      assertAmiConfigReady(amiConfigFromEnv({ AMI_SECRET: 'x' })),
    ).toBeNull();
  });
});
