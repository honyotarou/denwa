/** 同分スナップショットキー（UTC、秒以下切り捨て） */
export function concurrencyMinuteAtUtc(now: Date = new Date()): string {
  const iso = now.toISOString();
  return `${iso.slice(0, 16)}:00.000Z`;
}
