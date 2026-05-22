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
    expect(buildWssEndpointLabel('pbx.local', 9090)).toBe('wss://pbx.local:9090/ws');
  });

  it('Given no profiles When assess Then blocker', () => {
    expect(
      collectSoftphoneRegisterBlockers({
        profilesWithSecret: 0,
        devStackErrors: [],
        wssPortOpen: true,
        host: 'localhost',
      }),
    ).toEqual(['WebRTC 内線が未割当']);
  });

  it('Given dev stack errors When assess Then propagated', () => {
    expect(
      collectSoftphoneRegisterBlockers({
        profilesWithSecret: 1,
        devStackErrors: ['8089 not published'],
        wssPortOpen: null,
        host: 'localhost',
      }),
    ).toEqual(['8089 not published']);
  });

  it('Given wssPortOpen null When assess Then skip port check', () => {
    expect(
      collectSoftphoneRegisterBlockers({
        profilesWithSecret: 1,
        devStackErrors: [],
        wssPortOpen: null,
        host: 'localhost',
      }),
    ).toEqual([]);
  });
});
