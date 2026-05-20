import type { DeviceState } from './parse.js';
import { parseDeviceStateChangeEvent, parseAmiBlock } from './parse.js';

export type DeviceInfo = Readonly<{
  device: string;
  extension: string | null;
  state: DeviceState;
  updatedAt: string;
}>;

export type DeviceMap = Readonly<{
  applyBlock: (block: string) => DeviceInfo | null;
  getDevices: () => readonly DeviceInfo[];
  snapshot: () => ReadonlyMap<string, DeviceInfo>;
}>;

/** AMI device 状態 — class なし factory */
export function createDeviceMap(): DeviceMap {
  const devices = new Map<string, DeviceInfo>();

  return {
    applyBlock(block: string): DeviceInfo | null {
      const fields = parseAmiBlock(block);
      const parsed = parseDeviceStateChangeEvent(fields);
      if (!parsed) return null;
      const cur: DeviceInfo = {
        device: parsed.device,
        extension: parsed.extension,
        state: parsed.state,
        updatedAt: new Date().toISOString(),
      };
      devices.set(parsed.device, cur);
      return cur;
    },
    getDevices(): readonly DeviceInfo[] {
      return [...devices.values()].sort((a, b) =>
        (a.extension ?? '').localeCompare(b.extension ?? ''),
      );
    },
    snapshot(): ReadonlyMap<string, DeviceInfo> {
      return new Map(devices);
    },
  };
}
