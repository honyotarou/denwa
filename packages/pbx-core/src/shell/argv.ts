/** dialplan System() / notify-event 引数の単一正本（F-007 PBX-RCE-01） */

export const SHELL_ARG_SAFE_RE = /^[a-zA-Z0-9._\- @]{0,80}$/;

/** shell 位置引数として安全な ASCII のみ残す（それ以外は `_` に置換） */
export function sanitizeShellArgument(value: string): string {
  const v = (value ?? '').slice(0, 80);
  if (SHELL_ARG_SAFE_RE.test(v)) return v;
  return v.replace(/[^a-zA-Z0-9._\- @]/g, '_');
}
