import { createDeviceMap } from '@openpbx/infra/ami/device-map';
import { DEVICE_STREAM_MIN_ROLE } from '@openpbx/core';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { audit } from '../../audit';
import { withAuth } from '../with-auth';

export async function handleDevicesStreamGet(ctx: AppContext): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    (me) => {
      audit(ctx, me, 'devices.stream');
      const map = createDeviceMap();
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
    },
    { minRole: DEVICE_STREAM_MIN_ROLE },
  );
}
