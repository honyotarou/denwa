import { DeviceMap } from '@openpbx/infra/ami/device-map';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { authErrorResponse } from '../with-auth';

export async function handleDevicesStreamGet(ctx: AppContext): Promise<JsonHandlerResult> {
  try {
    ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  } catch (e) {
    const err = authErrorResponse(e);
    return {
      status: err.status,
      headers: { 'Content-Type': 'application/json' },
      stream: new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(JSON.stringify(err.body)));
          c.close();
        },
      }),
    };
  }
  const map = new DeviceMap();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const payload = { devices: map.getDevices(), connected: false };
      controller.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(payload)}\n\n`));
    },
  });
  return {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    stream,
  };
}
