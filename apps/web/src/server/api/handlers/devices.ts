import { DEVICE_STREAM_MIN_ROLE } from '@openpbx/core';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { audit } from '../../audit';
import { getAmiDeviceSession } from '../../ports/ami-devices';
import type { AmiDeviceSession } from '@openpbx/infra/ami/device-session';
import { withAuth } from '../with-auth';

export type DevicesStreamDeps = Readonly<{
  getSession: () => AmiDeviceSession;
}>;

const defaultDeps: DevicesStreamDeps = {
  getSession: getAmiDeviceSession,
};

function snapshotPayload(session: AmiDeviceSession) {
  return { devices: session.getDevices(), connected: session.isConnected() };
}

export async function handleDevicesStreamGet(
  ctx: AppContext,
  deps: DevicesStreamDeps = defaultDeps,
): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    (me) => {
      audit(ctx, me, 'devices.stream');
      const session = deps.getSession();
      session.start();
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const send = () => {
            const payload = snapshotPayload(session);
            controller.enqueue(
              encoder.encode(`event: snapshot\ndata: ${JSON.stringify(payload)}\n\n`),
            );
          };
          send();
          const off = session.onChange(send);
          const ping = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(': ping\n\n'));
            } catch {
              clearInterval(ping);
            }
          }, 10_000);
          (controller as unknown as { _close?: () => void })._close = () => {
            clearInterval(ping);
            off();
          };
        },
        cancel() {
          const c = this as unknown as { _close?: () => void };
          c._close?.();
        },
      });
      return {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
        stream,
      };
    },
    { minRole: DEVICE_STREAM_MIN_ROLE },
  );
}
