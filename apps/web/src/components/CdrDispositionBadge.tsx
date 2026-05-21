import { cdrDispositionTone } from '@openpbx/core';

const TONE_CLASS: Record<ReturnType<typeof cdrDispositionTone>, string> = {
  answered: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  'no-answer': 'border-amber-300 bg-amber-50 text-amber-800',
  busy: 'border-orange-300 bg-orange-50 text-orange-800',
  failed: 'border-red-300 bg-red-50 text-red-800',
  other: 'border-slate-300 bg-slate-50 text-slate-700',
};

export function CdrDispositionBadge({ disposition }: { disposition: string | null | undefined }) {
  const tone = cdrDispositionTone(disposition);
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${TONE_CLASS[tone]}`}>
      {disposition ?? '—'}
    </span>
  );
}
