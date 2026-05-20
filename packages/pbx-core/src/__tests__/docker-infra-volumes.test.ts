import { describe, expect, it } from 'vitest';
import {
  isForbiddenWebRwAsteriskVolume,
  webServiceMountsForbiddenAsteriskConfig,
} from '../docker/infra-volumes.js';

describe('T-SEC-MOUNT-001: F-002 web must not RW-mount git asterisk config', () => {
  it('Given web mounts git pjsip.d When check Then forbidden', () => {
    expect(isForbiddenWebRwAsteriskVolume('./asterisk/pjsip.d:/asterisk/pjsip.d')).toBe(true);
    expect(
      webServiceMountsForbiddenAsteriskConfig(['./data/pbx-out/pjsip.d:/asterisk/pjsip.d']),
    ).toEqual([]);
  });

  it('Given web mounts pbx-out only When check Then allowed', () => {
    const vols = [
      './data/pbx-out/pjsip.d:/asterisk/pjsip.d',
      './data/pbx-out/dialplan.d:/asterisk/dialplan.d',
    ];
    expect(webServiceMountsForbiddenAsteriskConfig(vols)).toEqual([]);
  });
});
