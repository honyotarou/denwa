import { describe, expect, it } from 'vitest';
import {
  parseUniqueidFromInboxMeta,
  parseUniqueidFromRecordingFilename,
} from '../media/uniqueid.js';

describe('T-MEDIA-001: uniqueid 抽出', () => {
  it('Given MixMonitor 名 When parse Then uniqueid', () => {
    expect(parseUniqueidFromRecordingFilename('1779308728.0-1001-to-1002.wav')).toBe('1779308728.0');
  });

  it('Given inbox meta When parse Then uniqueId', () => {
    expect(
      parseUniqueidFromInboxMeta({ uniqueId: '1779308728.0', schema: 'command-room-pbx/v1' }),
    ).toBe('1779308728.0');
  });

  it('Given 非 wav When parse Then null', () => {
    expect(parseUniqueidFromRecordingFilename('readme.txt')).toBeNull();
  });
});
