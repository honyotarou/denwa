import type { OriginateRequest } from '@openpbx/core';
import {
  amiConfigFromEnv,
  assertAmiConfigReady,
  originateOverTcp,
  type AmiConnectionConfig,
} from '@openpbx/infra';

/** AMI Originate ポート（テストで差し替え可能） */
export type AmiOriginatePort = Readonly<{
  originate: (request: OriginateRequest) => Promise<{ ok: boolean; raw: string }>;
}>;

export function createAmiOriginatePort(config?: AmiConnectionConfig): AmiOriginatePort {
  const cfg = config ?? amiConfigFromEnv();
  return {
    async originate(request) {
      const cfgErr = assertAmiConfigReady(cfg);
      if (cfgErr) throw new Error(cfgErr);
      return originateOverTcp(cfg, request);
    },
  };
}

/** Vitest / オフライン用 */
export function createStubAmiOriginatePort(
  impl: AmiOriginatePort['originate'] = async () => ({ ok: true, raw: 'Response: Success' }),
): AmiOriginatePort {
  return { originate: impl };
}
