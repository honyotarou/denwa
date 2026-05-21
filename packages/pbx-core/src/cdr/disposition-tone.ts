export type CdrDispositionTone = 'answered' | 'no-answer' | 'busy' | 'failed' | 'other';

export const CDR_DISPOSITION_OPTIONS = [
  '',
  'ANSWERED',
  'NO ANSWER',
  'BUSY',
  'FAILED',
] as const;

export function cdrDispositionTone(disposition: string | null | undefined): CdrDispositionTone {
  switch (disposition) {
    case 'ANSWERED':
      return 'answered';
    case 'NO ANSWER':
      return 'no-answer';
    case 'BUSY':
      return 'busy';
    case 'FAILED':
      return 'failed';
    default:
      return 'other';
  }
}
