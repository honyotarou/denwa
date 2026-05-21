import { describe, expect, it } from 'vitest';
import {
  collectSoftphoneRegisterBlockers,
  buildWssEndpointLabel,
} from '../softphone/wss-readiness.js';

describe('T-SOFT-016 G4 readiness', () => {
  it('Given dev stack ok and WSS open When assess Then no blockers', () => {
    expect(
      collectSoftphoneRegisterBlockers({
        profilesWithSecret: 1,
        devStackErrors: [],
        wssPortOpen: true,
        host: 'localhost',
      }),
    ).toEqual([]);
  });

  it('Given WSS closed When assess Then blocker', () => {
    expect(
      collectSoftphoneRegisterBlockers({
        profilesWithSecret: 1,
        devStackErrors: [],
        wssPortOpen: false,
        host: 'localhost',
      }),
    ).toEqual([
      'wss://localhost:8089/ws に到達できません（softphone-dev overlay + 証明書）',
    ]);
  });

  it('buildWssEndpointLabel', () => {
    expect(buildWssEndpointLabel('pbx.local')).toBe('wss://pbx.local:8089/ws');
  });
});
