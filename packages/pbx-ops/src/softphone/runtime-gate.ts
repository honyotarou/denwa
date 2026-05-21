import fs from 'node:fs';
import path from 'node:path';
import {
  collectSoftphoneRegisterBlockers,
  type SoftphoneRegisterReadinessInput,
} from '@openpbx/core/softphone/wss-readiness';
import { assessSoftphoneDevStack } from './dev-stack.js';
import { probeTcpPort } from './tcp-probe.js';

export type SoftphoneRuntimeAssessment = Readonly<{
  blockers: readonly string[];
  wssPortOpen: boolean | null;
}>;

export async function assessSoftphoneRuntime(
  repoRoot: string,
  opts: Readonly<{ host?: string; probeWss?: boolean }> = {},
): Promise<SoftphoneRuntimeAssessment> {
  const host = opts.host ?? '127.0.0.1';
  const certsDir = path.join(repoRoot, 'asterisk/certs');
  const exists = (p: string) => fs.existsSync(p);
  const devStackErrors = assessSoftphoneDevStack({
    certsDir,
    composeOverlayText: fs.readFileSync(
      path.join(repoRoot, 'docker-compose.softphone-dev.yml'),
      'utf8',
    ),
    httpDevConfText: fs.readFileSync(path.join(repoRoot, 'asterisk/http.dev.conf'), 'utf8'),
    exists,
  });

  let wssPortOpen: boolean | null = null;
  if (opts.probeWss) {
    const probe = await probeTcpPort(host, 8089);
    wssPortOpen = probe.ok;
  }

  const input: SoftphoneRegisterReadinessInput = {
    profilesWithSecret: 1,
    devStackErrors,
    wssPortOpen,
    host,
  };
  return { blockers: collectSoftphoneRegisterBlockers(input), wssPortOpen };
}
