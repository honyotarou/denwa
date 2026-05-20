import { applyAmiEventFields, type MutableDeviceInfo } from './apply-event.js';
import type { DeviceState } from './parse.js';
import { parseAmiBlock } from './parse.js';

export type DeviceInfo = Readonly<{
  device: string;
  extension: string | null;
  state: DeviceState;
  contact: string | null;
  reachable: boolean | null;
  updatedAt: string;
}>;

export type DeviceMap = Readonly<{
  applyBlock: (block: string) => DeviceInfo | null;
  getDevices: () => readonly DeviceInfo[];
  snapshot: () => ReadonlyMap<string, DeviceInfo>;
}>;

function freeze(d: MutableDeviceInfo): DeviceInfo {
  return {
    device: d.device,
    extension: d.extension,
    state: d.state,
    contact: d.contact,
    reachable: d.reachable,
    updatedAt: d.updatedAt,
  };
}

/** AMI device 状態 — class なし factory（T-AMI-004） */
export function createDeviceMap(): DeviceMap {
  const devices = new Map<string, MutableDeviceInfo>();

  return {
    applyBlock(block: string): DeviceInfo | null {
      const fields = parseAmiBlock(block);
      const cur = applyAmiEventFields(devices, fields);
      return cur ? freeze(cur) : null;
    },
    getDevices(): readonly DeviceInfo[] {
      return [...devices.values()]
        .map(freeze)
        .sort((a, b) => (a.extension ?? '').localeCompare(b.extension ?? ''));
    },
    snapshot(): ReadonlyMap<string, DeviceInfo> {
      return new Map(
        [...devices.entries()].map(([k, v]) => [k, freeze(v)] as const),
      );
    },
  };
}
