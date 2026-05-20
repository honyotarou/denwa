import type { DeviceState } from './parse.js';
import { parseDeviceStateChangeEvent, parseAmiBlock } from './parse.js';

export type DeviceInfo = Readonly<{
  device: string;
  extension: string | null;
  state: DeviceState;
  updatedAt: string;
}>;

export class DeviceMap {
  private readonly devices = new Map<string, DeviceInfo>();

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
    this.devices.set(parsed.device, cur);
    return cur;
  }

  getDevices(): DeviceInfo[] {
    return Array.from(this.devices.values()).sort((a, b) =>
      (a.extension ?? '').localeCompare(b.extension ?? ''),
    );
  }

  snapshot(): ReadonlyMap<string, DeviceInfo> {
    return new Map(this.devices);
  }
}
