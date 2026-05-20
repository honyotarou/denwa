import type Database from 'better-sqlite3';
import {
  normalizeNetworkSettingsDraft,
  type NetworkSettingsDraft,
  type NetworkSettingsInput,
} from '@openpbx/core';

type Row = {
  external_ip: string | null;
  external_signaling_ip: string | null;
  local_net: string | null;
  updated_at: string;
};

export type NetworkSettingsRow = Readonly<{
  externalIp: string | null;
  externalSignalingIp: string | null;
  localNet: string | null;
  updatedAt: string;
}>;

function map(r: Row): NetworkSettingsRow {
  return {
    externalIp: r.external_ip,
    externalSignalingIp: r.external_signaling_ip,
    localNet: r.local_net,
    updatedAt: r.updated_at,
  };
}

export function getNetworkSettings(db: Database.Database): NetworkSettingsRow {
  const r = db
    .prepare(
      'SELECT external_ip, external_signaling_ip, local_net, updated_at FROM network_settings WHERE id = 1',
    )
    .get() as Row | undefined;
  if (!r) {
    return { externalIp: null, externalSignalingIp: null, localNet: null, updatedAt: '' };
  }
  return map(r);
}

export function updateNetworkSettings(
  db: Database.Database,
  input: NetworkSettingsInput,
): NetworkSettingsRow {
  const draft: NetworkSettingsDraft = normalizeNetworkSettingsDraft(input);
  db.prepare(
    `UPDATE network_settings
        SET external_ip = ?, external_signaling_ip = ?, local_net = ?, updated_at = datetime('now')
      WHERE id = 1`,
  ).run(draft.externalIp, draft.externalSignalingIp, draft.localNet);
  return getNetworkSettings(db);
}
