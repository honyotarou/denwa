import { barHeightPercent } from '@openpbx/core';
import { countActiveChannels } from '@openpbx/infra';
import type { AmiDeviceSession } from '@openpbx/infra/ami/device-session';
import { listConcurrencySnapshots } from '@openpbx/db';
import type Database from 'better-sqlite3';

export type ConcurrencyUiData = Readonly<{
  currentChannels: number | null;
  snapshots: ReadonlyArray<{ minuteAt: string; channels: number }>;
  maxChannels: number;
  bars: ReadonlyArray<{ minuteAt: string; channels: number; heightPct: number }>;
}>;

export function getConcurrencyUiData(
  db: Database.Database,
  session: AmiDeviceSession,
  limit = 180,
): ConcurrencyUiData {
  const snapshots = listConcurrencySnapshots(db, limit);
  const ordered = [...snapshots].reverse();
  const maxChannels = Math.max(1, ...ordered.map((s) => s.channels), 0);
  const bars = ordered.map((s) => ({
    minuteAt: s.minuteAt,
    channels: s.channels,
    heightPct: barHeightPercent(s.channels, maxChannels),
  }));
  const currentChannels = session.isConnected()
    ? countActiveChannels(session.getDevices())
    : null;
  return { currentChannels, snapshots: ordered, maxChannels, bars };
}
