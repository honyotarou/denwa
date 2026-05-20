import { EventEmitter } from 'node:events';
import type { AmiConnectionConfig } from './config.js';
import { formatAmiAction, isAmiLoginAccepted } from './format.js';
import { applyAmiEventFields, type MutableDeviceInfo } from './apply-event.js';
import { parseAmiBlocks } from './parse.js';
import { amiReconnectDelayMs } from './reconnect.js';
import type { DeviceInfo } from './device-map.js';
import type { AmiSocketLike } from './originate.js';

export type AmiDeviceSession = Readonly<{
  start: () => void;
  destroy: () => void;
  isConnected: () => boolean;
  getDevices: () => readonly DeviceInfo[];
  onChange: (handler: () => void) => () => void;
}>;

export type AmiSocketFactory = (
  config: AmiConnectionConfig,
  handlers: Readonly<{
    onConnect: () => void;
    onData: (chunk: string) => void;
    onError: (err: Error) => void;
    onClose: () => void;
  }>,
) => AmiSocketLike;

function freezeDevice(d: MutableDeviceInfo): DeviceInfo {
  return {
    device: d.device,
    extension: d.extension,
    state: d.state,
    contact: d.contact,
    reachable: d.reachable,
    updatedAt: d.updatedAt,
  };
}

/** AMI 常駐セッション — TCP は socketFactory 注入（T-AMI-003/004） */
export function createAmiDeviceSession(
  config: AmiConnectionConfig,
  socketFactory: AmiSocketFactory,
): AmiDeviceSession {
  const emitter = new EventEmitter();
  const devices = new Map<string, MutableDeviceInfo>();
  let socket: AmiSocketLike | null = null;
  let buffer = '';
  let actionId = 0;
  let retries = 0;
  let tcpConnected = false;
  let loggedIn = false;
  let destroyed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let loginSent = false;

  const emitChange = () => emitter.emit('change');

  const send = (fields: Record<string, string>) => {
    socket?.write(formatAmiAction({ ...fields, ActionID: String(++actionId) }));
  };

  const syncAfterLogin = () => {
    send({ Action: 'DeviceStateList' });
    send({ Action: 'PJSIPShowEndpoints' });
  };

  const handleBlock = (block: string) => {
    if (!block.trim()) return;
    const fields = Object.fromEntries(
      block
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => {
          const idx = line.indexOf(':');
          return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] as const;
        }),
    );
    if (isAmiLoginAccepted(fields)) {
      loggedIn = true;
      syncAfterLogin();
      emitChange();
      return;
    }
    if (applyAmiEventFields(devices, fields)) emitChange();
  };

  const onData = (chunk: string) => {
    buffer += chunk;
    if (!loggedIn && !loginSent && buffer.includes('Asterisk Call Manager')) {
      const idx = buffer.indexOf('\r\n');
      if (idx >= 0) {
        buffer = buffer.slice(idx + 2);
        loginSent = true;
        send({ Action: 'Login', Username: config.username, Secret: config.secret, Events: 'on' });
      }
    }
    const parsed = parseAmiBlocks(buffer);
    buffer = parsed.remainder;
    for (const block of parsed.blocks) handleBlock(block);
  };

  const scheduleReconnect = () => {
    if (destroyed || reconnectTimer) return;
    const delay = amiReconnectDelayMs(retries++);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  const connect = () => {
    if (destroyed || socket) return;
    tcpConnected = false;
    loggedIn = false;
    loginSent = false;
    buffer = '';
    actionId = 0;
    socket = socketFactory(config, {
      onConnect: () => {
        tcpConnected = true;
        retries = 0;
      },
      onData,
      onError: () => {
        /* close で再接続 */
      },
      onClose: () => {
        socket = null;
        tcpConnected = false;
        loggedIn = false;
        if (!destroyed) scheduleReconnect();
        emitChange();
      },
    });
  };

  return {
    start() {
      if (destroyed || socket || reconnectTimer) return;
      connect();
    },
    destroy() {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = null;
      socket?.destroy();
      socket = null;
      emitter.removeAllListeners();
    },
    isConnected: () => tcpConnected && loggedIn,
    getDevices: () =>
      [...devices.values()]
        .map(freezeDevice)
        .sort((a, b) => (a.extension ?? '').localeCompare(b.extension ?? '')),
    onChange(handler: () => void) {
      emitter.on('change', handler);
      return () => emitter.off('change', handler);
    },
  };
}
