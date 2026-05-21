import { describe, expect, it } from 'vitest';
import {
  captureTriageSnapshot,
  restorePreviousTriageSnapshot,
} from '../triage/ui-state.js';

describe('T-TRIAGE-004: triage undo snapshot', () => {
  it('Given pick added recommendations When restore Then prior state', () => {
    const before = captureTriageSnapshot({
      currentId: 'lumbar-onset',
      history: [],
      recommendations: [],
      endText: null,
    });
    const after = {
      currentId: 'lumbar-rec',
      history: [{ nodeId: 'lumbar-onset', questionText: 'Q', answerLabel: 'A' }],
      recommendations: [{ kind: 'xray' as const, text: 'レントゲン' }],
      endText: '評価文',
    };
    const { restored, snapshots } = restorePreviousTriageSnapshot([before]);
    expect(restored).toEqual(before);
    expect(snapshots).toEqual([]);
    expect(after.recommendations).toHaveLength(1);
    expect(restored!.recommendations).toHaveLength(0);
    expect(restored!.endText).toBeNull();
  });

  it('Given no snapshots When restore Then null', () => {
    expect(restorePreviousTriageSnapshot([]).restored).toBeNull();
  });
});
