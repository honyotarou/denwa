import type { DeviceState } from '../ami/parse.js';

const ACTIVE_STATES = new Set<DeviceState>(['inuse', 'busy', 'ringing', 'ringinuse', 'onhold']);

/** T-CONC-003 / T-CONC-004 */
export function countActiveChannels(
  devices: ReadonlyArray<{ state: DeviceState }>,
): number {
  if (devices.length === 0) return 0;
  return devices.filter((d) => ACTIVE_STATES.has(d.state)).length;
}
