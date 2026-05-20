import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  COMPOSE_WEB_LOCAL_IP_ALLOW_DEFAULT,
  composeDefinesWebLocalIpAllowDefault,
  expectedWebDockerfile,
  parseWebBuildDockerfile,
} from '../docker/compose-env.js';
import { inspectNextConfigDockerOutput, inspectWebDockerfile } from '../docker/web-image.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

function readRepo(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

describe('T-DOCKER-007: web production image contract', () => {
  it('Given apps/web/Dockerfile When inspect Then not stub and listens on :3000', () => {
    const r = inspectWebDockerfile(readRepo('apps/web/Dockerfile'));
    expect(r.errors, r.errors.join('\n')).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('Given next.config.ts When inspect Then standalone output for monorepo', () => {
    const r = inspectNextConfigDockerOutput(readRepo('apps/web/next.config.ts'));
    expect(r.errors, r.errors.join('\n')).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('Given docker-compose.yml When parse Then web dockerfile path', () => {
    expect(parseWebBuildDockerfile(readRepo('docker-compose.yml'))).toBe(expectedWebDockerfile());
  });

  it('Given docker-compose.yml When inspect Then local IP_ALLOW default (T-SEC-IP-001)', () => {
    const compose = readRepo('docker-compose.yml');
    expect(composeDefinesWebLocalIpAllowDefault(compose)).toBe(true);
    expect(compose).toContain(`IP_ALLOW_CIDRS: \${IP_ALLOW_CIDRS:-${COMPOSE_WEB_LOCAL_IP_ALLOW_DEFAULT}}`);
  });
});
