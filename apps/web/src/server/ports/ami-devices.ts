import { amiConfigFromEnv, assertAmiConfigReady } from '@openpbx/infra/ami/config';
import { createAmiDeviceSession } from '@openpbx/infra/ami/device-session';
import { tcpAmiSocketFactory } from '@openpbx/infra/ami/device-session-tcp';
import type { AmiDeviceSession } from '@openpbx/infra/ami/device-session';

const GLOBAL_KEY = '__denwaAmiDeviceSession';
const GLOBAL_BG_KEY = '__denwaBackgroundTasksStarted';

function startBackgroundTasksLazy(session: AmiDeviceSession): void {
  if (process.env.VITEST) return;
  const g = globalThis as typeof globalThis & { [GLOBAL_BG_KEY]?: boolean };
  if (g[GLOBAL_BG_KEY]) return;
  g[GLOBAL_BG_KEY] = true;
  void import('../runtime/background-tasks').then(({ ensureBackgroundTasks }) => {
    ensureBackgroundTasks(session);
  });
}

function newSession(): AmiDeviceSession {
  const cfg = amiConfigFromEnv();
  const err = assertAmiConfigReady(cfg);
  if (err) {
    return createAmiDeviceSession(
      { ...cfg, secret: cfg.secret || 'disabled' },
      () => ({
        write: () => {},
        end: () => {},
        destroy: () => {},
        on: () => {},
      }),
    );
  }
  return createAmiDeviceSession(cfg, tcpAmiSocketFactory);
}

/** Next.js nodejs runtime 用 AMI 端末セッション singleton */
export function getAmiDeviceSession(): AmiDeviceSession {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: AmiDeviceSession;
  };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = newSession();
    g[GLOBAL_KEY].start();
    startBackgroundTasksLazy(g[GLOBAL_KEY]);
  }
  return g[GLOBAL_KEY];
}
