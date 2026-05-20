/** AMI 接続設定（env 正本 — T-API-009） */

export type AmiConnectionConfig = Readonly<{
  host: string;
  port: number;
  username: string;
  secret: string;
  timeoutMs: number;
}>;

export function amiConfigFromEnv(
  env: Readonly<Record<string, string | undefined>> = process.env,
): AmiConnectionConfig {
  return {
    host: env.AMI_HOST ?? 'asterisk',
    port: Number(env.AMI_PORT ?? '5038'),
    username: env.AMI_USERNAME ?? 'command-room',
    secret: env.AMI_SECRET ?? '',
    timeoutMs: Number(env.AMI_TIMEOUT_MS ?? '8000'),
  };
}

export function assertAmiConfigReady(cfg: AmiConnectionConfig): string | null {
  if (!cfg.secret) return 'AMI_SECRET が未設定です';
  if (!cfg.host) return 'AMI_HOST が未設定です';
  if (!Number.isFinite(cfg.port) || cfg.port <= 0) return 'AMI_PORT が不正です';
  return null;
}
