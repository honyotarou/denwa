import type { DeviceState } from './parse.js';
import {
  extractExtensionFromDevice,
  normalizeDeviceState,
  parseDeviceStateChangeEvent,
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
  cur.reachable =
    status === 'Reachable' || status === 'Created' || status === 'Updated';
  return cur;
}

function applyEndpointList(
  devices: Map<string, MutableDeviceInfo>,
  fields: Readonly<Record<string, string>>,
): MutableDeviceInfo | null {
  const event = fields.Event;
  if (event !== 'EndpointList' && event !== 'EndpointDetail') return null;
  const ao = fields.Aor ?? fields.ObjectName;
  if (!ao || !/^[0-9]+$/.test(ao)) return null;
  return upsert(devices, `PJSIP/${ao}`, ao);
}

/** AMI 1 イベント分を端末マップへ反映（純関数・T-AMI-001/007/008） */
export function applyAmiEventFields(
  devices: Map<string, MutableDeviceInfo>,
  fields: Readonly<Record<string, string>>,
): Readonly<MutableDeviceInfo> | null {
  const stateChange = parseDeviceStateChangeEvent(fields);
  if (stateChange) {
    const cur = upsert(devices, stateChange.device, stateChange.extension);
    cur.state = stateChange.state;
    return cur;
  }
  const contact = applyContactStatus(devices, fields);
  if (contact) return contact;
  return applyEndpointList(devices, fields);
}
