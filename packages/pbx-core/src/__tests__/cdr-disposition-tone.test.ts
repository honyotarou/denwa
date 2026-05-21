import { describe, expect, it } from 'vitest';
import { cdrDispositionTone } from '../cdr/disposition-tone.js';

describe('cdrDispositionTone', () => {
  it('Given ANSWERED When tone Then answered', () => {
    expect(cdrDispositionTone('ANSWERED')).toBe('answered');
  });

  it('Given unknown When tone Then other', () => {
    expect(cdrDispositionTone('CONGESTION')).toBe('other');
  });
});
