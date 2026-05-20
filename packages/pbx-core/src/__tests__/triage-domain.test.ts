import { describe, expect, it } from 'vitest';
import { FLOW } from '../triage/flow-graph.js';
import { validateFlowGraph } from '../triage/validate.js';
import { buildTriageSummary, mergeUniqueRecommendations } from '../triage/summary.js';

describe('T-TRIAGE: flow domain', () => {
  it('T-TRIAGE-001: Given FLOW When validateFlowGraph Then no errors', () => {
    expect(validateFlowGraph(FLOW)).toEqual([]);
  });

  it('T-TRIAGE-002: recommend node without items fails validation', () => {
    const bad = {
      bad: {
        id: 'bad',
        type: 'recommend' as const,
        text: 'x',
        recommends: [],
      },
    };
    expect(validateFlowGraph(bad)).not.toEqual([]);
  });

  it('T-TRIAGE-005: duplicate recommendations dedupe', () => {
    const a = { kind: 'xray' as const, text: '膝レントゲン' };
    const merged = mergeUniqueRecommendations([a], [a]);
    expect(merged).toHaveLength(1);
  });

  it('T-TRIAGE-006: urgent flag in summary', () => {
    const s = buildTriageSummary({
      history: [{ questionText: 'Q', answerLabel: 'A', flag: 'urgent' }],
      endText: null,
      recommendations: [],
    });
    expect(s).toContain('⚠️');
  });

  it('T-TRIAGE-007: memo section in summary', () => {
    const s = buildTriageSummary({
      history: [],
      endText: null,
      recommendations: [],
      memo: '  電話メモ  ',
    });
    expect(s).toContain('## メモ');
    expect(s).toContain('電話メモ');
  });
});
