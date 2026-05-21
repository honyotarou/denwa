/** CDR 一覧フィルタ（T-CDR-FILT-001） */

export type CdrListFilter = Readonly<{
  from?: string;
  to?: string;
  src?: string;
  dst?: string;
  disposition?: string;
  limit?: number;
}>;

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

export function normalizeCdrListFilter(input: CdrListFilter = {}): Required<Pick<CdrListFilter, 'limit'>> &
  CdrListFilter {
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  return {
    from: input.from?.trim() || undefined,
    to: input.to?.trim() || undefined,
    src: input.src?.trim() || undefined,
    dst: input.dst?.trim() || undefined,
    disposition: input.disposition?.trim() || undefined,
    limit,
  };
}
