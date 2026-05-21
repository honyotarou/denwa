/** 棒グラフ用の高さパーセント（T-CONC-CHART-001） */

export function barHeightPercent(channels: number, maxChannels: number): number {
  const max = Math.max(1, maxChannels);
  return Math.max(2, Math.round((channels / max) * 100));
}
