import { KIND_LABEL, type Recommendation } from './flow-graph.js';

export type TriageHistoryStep = Readonly<{
  questionText: string;
  answerLabel: string;
  flag?: 'red' | 'urgent' | 'normal';
}>;

export function mergeUniqueRecommendations(
  existing: readonly Recommendation[],
  added: readonly Recommendation[],
): Recommendation[] {
  const out = [...existing];
  for (const r of added) {
    if (!out.some((x) => x.kind === r.kind && x.text === r.text)) out.push(r);
  }
  return out;
}

export function buildTriageSummary(input: {
  history: readonly TriageHistoryStep[];
  endText: string | null;
  recommendations: readonly Recommendation[];
  memo?: string;
}): string {
  const lines: string[] = ['# 問診サマリ（受付補助）'];
  if (input.history.length > 0) {
    lines.push('', '## 問診経過');
    for (const h of input.history) {
      const mark = h.flag === 'urgent' ? ' ⚠️' : h.flag === 'red' ? ' ⚑' : '';
      lines.push(`- Q: ${h.questionText}`);
      lines.push(`  → A: ${h.answerLabel}${mark}`);
    }
  }
  if (input.endText) {
    lines.push('', `## 評価メモ: ${input.endText}`);
  }
  if (input.recommendations.length > 0) {
    lines.push('', '## 推奨検査・対応（参考）');
    for (const r of input.recommendations) {
      lines.push(`- [${KIND_LABEL[r.kind]}]${r.urgent ? ' (要確認)' : ''} ${r.text}`);
    }
  }
  if (input.memo?.trim()) {
    lines.push('', '## メモ', input.memo.trim());
  }
  return lines.join('\n');
}
