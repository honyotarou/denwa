import {
  reconcileStateWithReachability,
  resolveContactReachable,
} from '@openpbx/core';
import type { DeviceState } from './parse.js';
import {
  extractExtensionFromDevice,
  parseDeviceStateChangeEvent,
  parseEndpointListEvent,
} from './parse.js';

export type MutableDeviceInfo = {
  device: string;
  extension: string | null;
  state: DeviceState;
  contact: string | null;
  reachable: boolean | null;
  updatedAt: string;
};

function upsert(
  devices: Map<string, MutableDeviceInfo>,
  device: string,
  extension: string | null,
): MutableDeviceInfo {
  const cur = devices.get(device) ?? {
    device,
    extension,
    state: 'unknown',
    contact: null,
    reachable: null,
    updatedAt: new Date().toISOString(),
  };
  if (extension) cur.extension = extension;
  cur.updatedAt = new Date().toISOString();
  devices.set(device, cur);
  return cur;
}

function applyReachability(
  cur: MutableDeviceInfo,
  reachable: boolean | null,
): void {
  if (reachable === null) return;
  cur.reachable = reachable;
  cur.state = reconcileStateWithReachability(cur.state, reachable);
}

function applyContactStatus(
  devices: Map<string, MutableDeviceInfo>,
  fields: Readonly<Record<string, string>>,
): MutableDeviceInfo | null {
  const event = fields.Event;
  if (event !== 'ContactStatus' && event !== 'ContactStatusDetail') return null;
  const ao = fields.AOR ?? fields.Aor;
  if (!ao) return null;
  const device = `PJSIP/${ao}`;
  const status = fields.Status ?? fields.ContactStatus;
  const cur = upsert(devices, device, /^[0-9]+$/.test(ao) ? ao : extractExtensionFromDevice(device));
  cur.contact = fields.URI ?? cur.contact;
  applyReachability(cur, resolveContactReachable(status));
  return cur;
}

function applyEndpointList(
  devices: Map<string, MutableDeviceInfo>,
  fields: Readonly<Record<string, string>>,
): MutableDeviceInfo | null {
  const parsed = parseEndpointListEvent(fields);
  if (!parsed) return null;
  const cur = upsert(devices, parsed.device, parsed.extension);
  if (parsed.state) cur.state = parsed.state;
  if (parsed.contactCount === 0 && cur.reachable === null) {
    applyReachability(cur, false);
  }
  return cur;
}

/** AMI 1 イベント分を端末マップへ反映（純関数・T-AMI-001/007/008/011） */
export function applyAmiEventFields(
  devices: Map<string, MutableDeviceInfo>,
  fields: Readonly<Record<string, string>>,
): Readonly<MutableDeviceInfo> | null {
  const stateChange = parseDeviceStateChangeEvent(fields);
  if (stateChange) {
    const cur = upsert(devices, stateChange.device, stateChange.extension);
    cur.state = stateChange.state;
    if (cur.reachable !== null) {
      cur.state = reconcileStateWithReachability(cur.state, cur.reachable);
    }
    return cur;
  }
  const contact = applyContactStatus(devices, fields);
  if (contact) return contact;
  return applyEndpointList(devices, fields);
}
