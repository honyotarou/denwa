import { describe, expect, it } from 'vitest';
import { attachCdrMediaLinks, mediaLinkMapsFromRows } from '../media/cdr-links.js';
import type { CdrUiRow } from '../cdr/ui-row.js';

const row: CdrUiRow = {
  uniqueid: 'u1',
  startTime: null,
  src: '1001',
  dst: '1002',
  billsec: 0,
  disposition: 'ANSWERED',
  cost: 0,
  ratePrefix: null,
};

describe('T-MEDIA-002: CDR メディアリンク', () => {
  it('Given maps When attach Then recording と inbox', () => {
    const { recordingByUniqueid, inboxMetaByUniqueid } = mediaLinkMapsFromRows(
      [{ uniqueid: 'u1', name: 'u1-1001-to-1002.wav' }],
      [{ uniqueid: 'u1', metaName: 'u1.meta.json' }],
    );
    const out = attachCdrMediaLinks([row], recordingByUniqueid, inboxMetaByUniqueid);
    expect(out[0]!.recordingFile).toBe('u1-1001-to-1002.wav');
    expect(out[0]!.inboxMetaName).toBe('u1.meta.json');
  });
});
