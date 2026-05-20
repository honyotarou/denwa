export type DeviceState =
  | 'unknown'
  | 'not_inuse'
  | 'inuse'
  | 'busy'
  | 'invalid'
  | 'unavailable'
  | 'ringing'
  | 'ringinuse'
  | 'onhold';

const STATE_MAP: Record<string, DeviceState> = {
  UNKNOWN: 'unknown',
  NOT_INUSE: 'not_inuse',
  INUSE: 'inuse',
  BUSY: 'busy',
  INVALID: 'invalid',
  UNAVAILABLE: 'unavailable',
  RINGING: 'ringing',
  RINGINUSE: 'ringinuse',
  ONHOLD: 'onhold',
  'Not in use': 'not_inuse',
  'In use': 'inuse',
  Busy: 'busy',
  Ringing: 'ringing',
  Unavailable: 'unavailable',
};

export function parseAmiBlock(block: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return fields;
}

export function parseAmiBlocks(buffer: string): { blocks: string[]; remainder: string } {
  const parts = buffer.split('\r\n\r\n');
  const remainder = parts.pop() ?? '';
  return { blocks: parts.filter(Boolean), remainder };
}

export function normalizeDeviceState(raw: string | undefined): DeviceState {
  if (!raw) return 'unknown';
  return STATE_MAP[raw] ?? STATE_MAP[raw.toUpperCase()] ?? 'unknown';
}

export function extractExtensionFromDevice(device: string): string | null {
  const m = device.match(/^PJSIP\/([0-9a-zA-Z_]+)/);
  return m ? m[1]! : null;
}

export type ParsedDeviceStateChange = Readonly<{
  device: string;
  extension: string | null;
  state: DeviceState;
}>;

/** T-AMI-001 */
export function parseDeviceStateChangeEvent(
  fields: Record<string, string>,
): ParsedDeviceStateChange | null {
  const event = fields.Event;
  if (event !== 'DeviceStateChange' && event !== 'DeviceStateChanged' && event !== 'DeviceStateList') {
    return null;
  }
  const device = fields.Device;
  if (!device) return null;
  return {
    device,
    extension: extractExtensionFromDevice(device),
    state: normalizeDeviceState(fields.State),
  };
}
