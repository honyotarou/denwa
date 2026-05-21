import fs from 'node:fs/promises';
import path from 'node:path';
import { summarizeDeviceOnline } from '@openpbx/core';
import type { AmiDeviceSession } from '@openpbx/infra/ami/device-session';
import { countInboxFiles } from '@openpbx/infra';
import { listExtensions } from '@openpbx/db';
import type Database from 'better-sqlite3';
import { inboxDirectory } from '../paths';

export async function countInboxSummaryFromDir() {
  return countInboxFiles(inboxDirectory());
}

export function getDeviceOnlineSummary(session: AmiDeviceSession): {
  online: number | null;
  total: number | null;
  amiReady: boolean;
} {
  if (!session.isConnected()) {
    return { online: null, total: null, amiReady: false };
  }
  const devices = session.getDevices().filter((d) => d.device.startsWith('PJSIP/'));
  const { online, total } = summarizeDeviceOnline(
    devices.map((d) => ({
      extension: d.extension,
      reachable: d.reachable,
      state: d.state,
    })),
  );
  return { online, total, amiReady: true };
}

export async function getPjsipExtensionsMtime(pjsipDir: string): Promise<string | null> {
  try {
    const st = await fs.stat(path.join(pjsipDir, 'extensions.conf'));
    return st.mtime.toISOString();
  } catch {
    return null;
  }
}

export function listExtensionsForHome(db: Database.Database) {
  return listExtensions(db);
}
