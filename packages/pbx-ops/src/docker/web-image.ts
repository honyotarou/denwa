/** Web 本番イメージ契約（T-DOCKER-007）。Phase 2.5 stub 再発防止。 */

export const WEB_DOCKER_FORBIDDEN_MARKERS = [
  'command-room-web-stub',
  'setInterval(() => {}, 60000)',
] as const;

export const WEB_DOCKER_REQUIRED_MARKERS = [
  'apps/web/server.js',
  'EXPOSE 3000',
  'HOSTNAME=0.0.0.0',
  '.next/standalone',
] as const;

export const NEXT_CONFIG_DOCKER_REQUIRED_MARKERS = [
  "output: 'standalone'",
  'outputFileTracingRoot',
] as const;

export function inspectWebDockerfile(text: string): Readonly<{ ok: boolean; errors: readonly string[] }> {
  const errors: string[] = [];
  for (const marker of WEB_DOCKER_FORBIDDEN_MARKERS) {
    if (text.includes(marker)) {
      errors.push(`apps/web/Dockerfile: forbidden stub marker (${marker})`);
    }
  }
  for (const marker of WEB_DOCKER_REQUIRED_MARKERS) {
    if (!text.includes(marker)) {
      errors.push(`apps/web/Dockerfile: missing required (${marker})`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function inspectNextConfigDockerOutput(
  text: string,
): Readonly<{ ok: boolean; errors: readonly string[] }> {
  const errors: string[] = [];
  const hasStandalone =
    text.includes("output: 'standalone'") || text.includes('output: "standalone"');
  if (!hasStandalone) {
    errors.push('apps/web/next.config.ts: output standalone required for Docker runner');
  }
  if (!text.includes('outputFileTracingRoot')) {
    errors.push('apps/web/next.config.ts: outputFileTracingRoot required (monorepo trace)');
  }
  return { ok: errors.length === 0, errors };
}
