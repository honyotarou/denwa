import { describe, expect, it, vi } from 'vitest';
import { applyAmiEventFields } from '../ami/apply-event.js';
import { createDeviceMap } from '../ami/device-map.js';
import { isAmiLoginAccepted, formatAmiAction } from '../ami/format.js';
import { createAmiDeviceSession } from '../ami/device-session.js';
import type { AmiSocketFactory } from '../ami/device-session.js';
import type { AmiConnectionConfig } from '../ami/config.js';

const CFG: AmiConnectionConfig = {
  host: 'asterisk',
  port: 5038,
  username: 'command-room',
  secret: 'test-secret',
  timeoutMs: 5000,
};

describe('T-AMI-007/008: apply AMI device events', () => {
  it('Given ContactStatus Reachable When apply Then reachable true', () => {
    const map = createDeviceMap();
    map.applyBlock(
      'Event: ContactStatus\r\nAOR: 1002\r\nStatus: Reachable\r\nURI: sip:1002@192.168.1.1\r\n',
    );
    const d = map.getDevices()[0]!;
    expect(d.extension).toBe('1002');
    expect(d.reachable).toBe(true);
    expect(d.contact).toContain('sip:1002');
  });

  it('Given EndpointList When apply Then numeric extension seeded', () => {
    const devices = new Map();
    applyAmiEventFields(devices, {
      Event: 'EndpointList',
      ObjectName: '1001',
    });
    expect(devices.get('PJSIP/1001')?.extension).toBe('1001');
  });
});

describe('T-AMI-009: AMI login accepted', () => {
  it('Given Success auth message When isAmiLoginAccepted Then true', () => {
    expect(
      isAmiLoginAccepted({
        Response: 'Success',
        Message: 'Authentication accepted',
      }),
    ).toBe(true);
  });
});

describe('T-AMI-010: device session over mock socket', () => {
  it('Given login and DeviceStateChange When session Then connected and devices', async () => {
    const factory: AmiSocketFactory = (_cfg, handlers) => {
      let loginWritten = false;
      queueMicrotask(() => {
        handlers.onConnect();
        handlers.onData('Asterisk Call Manager/7.0.0\r\n');
      });
      return {
        write: () => {
          if (loginWritten) return;
          loginWritten = true;
          queueMicrotask(() => {
            handlers.onData(
              'Response: Success\r\nMessage: Authentication accepted\r\n\r\n',
            );
            handlers.onData(
              'Event: DeviceStateChange\r\nDevice: PJSIP/1001\r\nState: Not inuse\r\n\r\n',
            );
            handlers.onData(
              'Event: ContactStatus\r\nAOR: 1001\r\nStatus: Reachable\r\nURI: sip:1001@lan\r\n\r\n',
            );
          });
        },
        end: () => {},
        destroy: () => {},
        on: () => {},
      };
    };

    const session = createAmiDeviceSession(CFG, factory);
    const changes: number[] = [];
    session.onChange(() => changes.push(session.getDevices().length));
    session.start();

    await vi.waitFor(() => expect(session.isConnected()).toBe(true), { timeout: 2000 });
    await vi.waitFor(() => expect(session.getDevices().length).toBeGreaterThan(0), {
      timeout: 2000,
    });

    const d = session.getDevices().find((x) => x.extension === '1001');
    expect(d?.state).toBe('not_inuse');
    expect(d?.reachable).toBe(true);
    expect(formatAmiAction({ Action: 'Ping' })).toContain('Action: Ping\r\n');
    session.destroy();
  });
});
