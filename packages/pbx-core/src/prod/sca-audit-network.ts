/** npm audit 実行結果の分類（T-SEC-SCA-004 — オフライン/レジストリ不可） */

export type NpmAuditSkipReason = 'registry_unavailable';

/** npm audit がレジストリ到達不能で失敗したか */
export function isNpmRegistryUnavailable(output: string): boolean {
  const text = (output ?? '').toLowerCase();
  return (
    /enotfound|eai_again|econnrefused|etimedout|network/.test(text) ||
    /getaddrinfo/.test(text) ||
    /audit endpoint returned an error/.test(text) ||
    /npm warn audit request/.test(text)
  );
}

export type NpmAuditExecOutcome =
  | Readonly<{ kind: 'ok' }>
  | Readonly<{ kind: 'blocked'; detail: string }>
  | Readonly<{ kind: 'skip'; reason: NpmAuditSkipReason; detail: string }>;

/** execSync npm audit の catch 内容を分類 */
export function classifyNpmAuditExecError(err: {
  status?: number | null;
  message?: string;
  stderr?: string | Buffer;
  stdout?: string | Buffer;
}): NpmAuditExecOutcome {
  const stderr = typeof err.stderr === 'string' ? err.stderr : (err.stderr?.toString() ?? '');
  const stdout = typeof err.stdout === 'string' ? err.stdout : (err.stdout?.toString() ?? '');
  const combined = `${stderr}\n${stdout}\n${err.message ?? ''}`;
  if (isNpmRegistryUnavailable(combined)) {
    return { kind: 'skip', reason: 'registry_unavailable', detail: combined.trim() };
  }
  return { kind: 'blocked', detail: combined.trim() || `npm audit exit ${err.status ?? 'unknown'}` };
}
