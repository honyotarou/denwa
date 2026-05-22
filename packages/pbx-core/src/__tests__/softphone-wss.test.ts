import { describe, expect, it } from 'vitest';
import { buildSipJsTransportOptions, buildWssTransportUrl } from '../softphone/wss.js';

describe('softphone wss (T-SOFT-016/017)', () => {
  it('buildWssTransportUrl defaults empty host to localhost', () => {
    expect(buildWssTransportUrl('')).toBe('wss://localhost:8089/ws');
    expect(buildWssTransportUrl('   ')).toBe('wss://localhost:8089/ws');
  });

  it('buildWssTransportUrl custom port', () => {
    expect(buildWssTransportUrl('host', 9090)).toBe('wss://host:9090/ws');
  });

  it('buildSipJsTransportOptions custom port and timeout', () => {
    expect(
      buildSipJsTransportOptions('pbx', { port: 9090, connectionTimeoutSec: 10 }),
    ).toEqual({
      server: 'wss://pbx:9090/ws',
      connectionTimeout: 10,
    });
  });
});
