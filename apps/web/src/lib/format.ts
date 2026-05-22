export function formatBytes(n: number): string {
  if (n < 0) return '-';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatYen(n: number): string {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`;
}
