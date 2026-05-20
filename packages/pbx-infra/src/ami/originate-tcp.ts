import net from 'node:net';
import type { OriginateRequest } from '@openpbx/core';
import type { AmiConnectionConfig } from './config.js';
import { originateOverSocket, type AmiSocketLike } from './originate.js';

/** TCP で AMI に接続して Originate（T-AMI-005 本番経路） */
export function originateOverTcp(
  config: AmiConnectionConfig,
  request: OriginateRequest,
): Promise<{ ok: boolean; raw: string }> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: config.host, port: config.port });
    socket.setEncoding('utf-8');

    const amiSocket: AmiSocketLike = {
      write: (data) => socket.write(data),
      end: () => socket.end(),
      destroy: () => socket.destroy(),
      on: (event, handler) => {
        if (event === 'data') socket.on('data', handler as (chunk: string) => void);
        else socket.on('error', handler as (err: Error) => void);
      },
    };

    const onConnect = () => {
      originateOverSocket(amiSocket, {
        username: config.username,
        secret: config.secret,
        request,
        timeoutMs: config.timeoutMs,
      })
        .then(resolve)
        .catch(reject);
    };

    socket.once('connect', onConnect);
    socket.once('error', reject);
  });
}
