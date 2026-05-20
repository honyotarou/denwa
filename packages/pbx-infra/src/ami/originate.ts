import { buildOriginateAction, type OriginateRequest } from '@openpbx/core';

export class AmiOriginateError extends Error {
  readonly code: 'LOGIN_FAILED' | 'ORIGINATE_FAILED' | 'TIMEOUT';
  constructor(code: AmiOriginateError['code'], message: string) {
    super(message);
    this.name = 'AmiOriginateError';
    this.code = code;
  }
}

export type AmiSocketLike = Readonly<{
  write: (data: string) => void;
  end: () => void;
  destroy: () => void;
  on: (event: 'data' | 'error', handler: (arg: string | Error) => void) => void;
}>;

export type OriginateAmiOptions = Readonly<{
  username: string;
  secret: string;
  request: OriginateRequest;
  timeoutMs?: number;
}>;

/** T-AMI-005 / T-AMI-006 — テスト用に socket を注入 */
export function originateOverSocket(
  socket: AmiSocketLike,
  opts: OriginateAmiOptions,
): Promise<{ ok: boolean; raw: string }> {
  return new Promise((resolve, reject) => {
    let buf = '';
    let stage: 'greeting' | 'login' | 'originate' | 'done' = 'greeting';
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new AmiOriginateError('TIMEOUT', 'AMI originate timeout'));
    }, opts.timeoutMs ?? 8000);

    const send = (fields: Record<string, string>) => {
      socket.write(
        Object.entries(fields)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\r\n') + '\r\n\r\n',
      );
    };

    socket.on('data', (chunk) => {
      if (typeof chunk !== 'string') return;
      buf += chunk;
      if (stage === 'greeting' && buf.includes('Asterisk Call Manager')) {
        stage = 'login';
        send({ Action: 'Login', Username: opts.username, Secret: opts.secret, Events: 'off' });
        buf = '';
      } else if (stage === 'login' && /Response: (Success|Error)/.test(buf)) {
        if (!/Response: Success/.test(buf)) {
          clearTimeout(timer);
          socket.destroy();
          reject(new AmiOriginateError('LOGIN_FAILED', 'AMI login failed'));
          return;
        }
        stage = 'originate';
        send(buildOriginateAction(opts.request));
        buf = '';
      } else if (stage === 'originate' && /Response: (Success|Error)/.test(buf)) {
        const ok = /Response: Success/.test(buf);
        stage = 'done';
        clearTimeout(timer);
        const raw = buf;
        send({ Action: 'Logoff' });
        socket.end();
        if (!ok) {
          reject(new AmiOriginateError('ORIGINATE_FAILED', raw));
          return;
        }
        resolve({ ok, raw });
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      reject(err instanceof Error ? err : new Error(String(err)));
    });
  });
}
