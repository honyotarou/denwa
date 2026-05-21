/** G4b: ソフトフォン REGISTER 前の readiness（純関数 / T-SOFT-016） */

import { buildWssTransportUrl } from './wss.js';

export type SoftphoneRegisterReadinessInput = Readonly<{
  profilesWithSecret: number;
  devStackErrors: readonly string[];
  wssPortOpen: boolean | null;
  host: string;
}>;

export function buildWssEndpointLabel(host: string, port = 8089): string {
  return buildWssTransportUrl(host, port);
}

/** REGISTER を試みる前に UI が出すべきブロッカー（空なら OK） */
export function collectSoftphoneRegisterBlockers(
  input: SoftphoneRegisterReadinessInput,
): readonly string[] {
  const errors: string[] = [];
  if (input.profilesWithSecret <= 0) {
    errors.push('WebRTC 内線が未割当');
  }
  for (const e of input.devStackErrors) {
    errors.push(e);
  }
  if (input.wssPortOpen === false) {
    errors.push(
      `${buildWssEndpointLabel(input.host)} に到達できません（softphone-dev overlay + 証明書）`,
    );
  }
  return errors;
}
