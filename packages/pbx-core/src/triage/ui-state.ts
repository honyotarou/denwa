import type { Recommendation } from './flow-graph.js';

export type TriageUiHistoryStep = Readonly<{
  nodeId: string;
  questionText: string;
  answerLabel: string;
  flag?: 'red' | 'urgent' | 'normal';
}>;

export type TriageUiSnapshot = Readonly<{
  currentId: string;
  history: readonly TriageUiHistoryStep[];
  recommendations: readonly Recommendation[];
  endText: string | null;
}>;

export function captureTriageSnapshot(state: TriageUiSnapshot): TriageUiSnapshot {
  return {
    currentId: state.currentId,
    history: [...state.history],
    recommendations: [...state.recommendations],
    endText: state.endText,
  };
}

/** 戻る: 直前の snapshot を復元（T-TRIAGE-004） */
export function restorePreviousTriageSnapshot(
  snapshots: readonly TriageUiSnapshot[],
): Readonly<{ restored: TriageUiSnapshot | null; snapshots: readonly TriageUiSnapshot[] }> {
  if (snapshots.length === 0) {
    return { restored: null, snapshots };
  }
  const restored = snapshots[snapshots.length - 1]!;
  return { restored, snapshots: snapshots.slice(0, -1) };
}
