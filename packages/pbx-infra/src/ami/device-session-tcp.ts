import net from 'node:net';
import type { AmiSocketFactory } from './device-session.js';
import type { AmiSocketLike } from './originate.js';

/** 本番: Node net.Socket で AMI 常駐接続 */
export const tcpAmiSocketFactory: AmiSocketFactory = (config, handlers) => {
  const socket = net.createConnection({ host: config.host, port: config.port });
  socket.setEncoding('utf-8');
  socket.once('connect', () => handlers.onConnect());
  socket.on('data', (chunk: string) => handlers.onData(chunk));
  socket.on('error', (err) => handlers.onError(err instanceof Error ? err : new Error(String(err))));
  socket.on('close', () => handlers.onClose());
  return {
    write: (data) => socket.write(data),
    end: () => socket.end(),
    destroy: () => socket.destroy(),
    on: (event, handler) => {
      if (event === 'data') socket.on('data', handler as (c: string) => void);
      else socket.on('error', handler as (e: Error) => void);
    },
  };
};
