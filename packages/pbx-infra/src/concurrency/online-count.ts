import type { DeviceState } from '../ami/parse.js';

const OFFLINE_STATES = new Set<DeviceState>(['unavailable', 'unknown', 'invalid']);

/** ダッシュボード用: AMI 上で「登録・利用可能」とみなす端末数（T-DASH-001） */
export function countOnlineDevices(
  devices: ReadonlyArray<{ state: DeviceState }>,
): number {
  return devices.filter((d) => !OFFLINE_STATES.has(d.state)).length;
}
