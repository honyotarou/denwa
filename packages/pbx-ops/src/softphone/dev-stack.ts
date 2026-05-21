import path from 'node:path';
import { softphoneDevCertsReady, type PathExists } from './dev-ready.js';

export type SoftphoneDevStackInput = Readonly<{
  certsDir: string;
  composeOverlayText: string;
  httpDevConfText: string;
  exists: PathExists;
}>;

/** T-SOFT-016: dev WebRTC スタックが揃っているか（証明書 + overlay 8089 + http.dev.conf） */
export function assessSoftphoneDevStack(input: SoftphoneDevStackInput): readonly string[] {
  const errors: string[] = [];
  if (!softphoneDevCertsReady(input.certsDir, input.exists)) {
    errors.push('asterisk/certs: asterisk.pem と asterisk.key が必要（gen-dev-asterisk-certs.sh）');
  }
  if (!/8089:8089\/tcp/.test(input.composeOverlayText)) {
    errors.push('docker-compose.softphone-dev.yml: 8089:8089/tcp が必要');
  }
  if (!/http\.dev\.conf/.test(input.composeOverlayText)) {
    errors.push('docker-compose.softphone-dev.yml: http.dev.conf マウントが必要');
  }
  if (!/tlsbindaddr=0\.0\.0\.0:8089/.test(input.httpDevConfText)) {
    errors.push('asterisk/http.dev.conf: tlsbindaddr=0.0.0.0:8089 が必要');
  }
  return errors;
}

export function defaultSoftphoneDevPaths(repoRoot: string): SoftphoneDevStackInput {
  return {
    certsDir: path.join(repoRoot, 'asterisk/certs'),
    composeOverlayText: '',
    httpDevConfText: '',
    exists: () => false,
  };
}
