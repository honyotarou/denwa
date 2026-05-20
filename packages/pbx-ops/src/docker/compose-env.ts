import type { ComposeDraft } from '@openpbx/core';

/** ローカル compose 用 IP 許可デフォルト（T-SEC-IP-001）。本番 .env では狭くする。 */
export const COMPOSE_WEB_LOCAL_IP_ALLOW_DEFAULT =
  '127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16' as const;

/** docker-compose web.environment（T-DOCKER-004, §10） */
export const WEB_REQUIRED_ENV_KEYS = [
  'NODE_ENV',
  'IP_ALLOW_CIDRS',
  'DATABASE_PATH',
  'RECORDINGS_DIR',
  'INBOX_DIR',
  'PJSIP_OUT_DIR',
  'DIALPLAN_OUT_DIR',
  'ASTERISK_SIGNAL_DIR',
  'AMI_HOST',
  'AMI_PORT',
  'AMI_USERNAME',
  'AMI_SECRET',
  'CDR_CSV_PATH',
  'SOUNDS_DIR',
] as const;

/** asterisk service（T-DOCKER-005） */
export const ASTERISK_REQUIRED_ENV_KEYS = ['INBOX_DIR'] as const;

export function missingEnvKeys(
  draft: ComposeDraft,
  service: string,
  required: readonly string[],
): readonly string[] {
  const keys = new Set(draft.services[service]?.environmentKeys ?? []);
  return required.filter((k) => !keys.has(k));
}

export function parseComposeBuildContexts(text: string): Readonly<Record<string, string>> {
  const contexts: Record<string, string> = {};
  const lines = text.split(/\r?\n/);
  let currentService: string | null = null;
  let inBuild = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const svc = /^  ([a-z0-9_-]+):\s*$/.exec(line);
    if (svc) {
      currentService = svc[1]!;
      inBuild = false;
      continue;
    }
    if (/^    build:\s*$/.test(line)) {
      inBuild = true;
      continue;
    }
    const ctx = /^      context:\s*(.+)$/.exec(line);
    if (ctx && currentService && inBuild) {
      contexts[currentService] = ctx[1]!.trim();
      inBuild = false;
    }
  }
  return contexts;
}

export function expectedBuildContexts(): Readonly<Record<string, string>> {
  return { asterisk: './asterisk', web: '.' };
}

export function expectedWebDockerfile(): string {
  return 'apps/web/Dockerfile';
}

/** web.build.dockerfile（T-DOCKER-006） */
export function parseWebBuildDockerfile(text: string): string | null {
  const lines = text.split(/\r?\n/);
  let inWeb = false;
  let inBuild = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^  web:\s*$/.test(line)) {
      inWeb = true;
      inBuild = false;
      continue;
    }
    if (inWeb && /^  [a-z0-9_-]+:\s*$/.test(line) && !/^  web:\s*$/.test(line)) {
      inWeb = false;
      inBuild = false;
      continue;
    }
    if (inWeb && /^    build:\s*$/.test(line)) {
      inBuild = true;
      continue;
    }
    const df = /^      dockerfile:\s*(.+)$/.exec(line);
    if (df && inWeb && inBuild) {
      return df[1]!.trim();
    }
    if (inWeb && /^    [a-z].+/.test(line) && !/^    build/.test(line)) {
      inBuild = false;
    }
  }
  return null;
}

export function composeDefinesWebLocalIpAllowDefault(text: string): boolean {
  return text.includes(COMPOSE_WEB_LOCAL_IP_ALLOW_DEFAULT);
}
