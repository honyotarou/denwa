import fs from 'node:fs/promises';
import path from 'node:path';
import type Database from 'better-sqlite3';
import {
  listExtensions,
  listHolidays,
  listBillingRates,
  listVersionUpgrades,
  listAudit,
  listLoginHistory,
  searchPhonebook,
} from '@openpbx/db';
import { getAppDb } from './app-context';

export function db(): Database.Database {
  return getAppDb();
}

export function listAccounts() {
  return db()
    .prepare(
      `SELECT id, username, display_name AS displayName, role, updated_at AS updatedAt FROM accounts ORDER BY username`,
    )
    .all() as Array<{
    id: number;
    username: string;
    displayName: string | null;
    role: string;
    updatedAt: string;
  }>;
}

export function listRingGroups() {
  const rows = db()
    .prepare(`SELECT id, number, name, strategy, ring_seconds AS ringSeconds, fallback_extension AS fallbackExtension FROM ring_groups ORDER BY number`)
    .all() as Array<{
    id: number;
    number: string;
    name: string | null;
    strategy: string;
    ringSeconds: number;
    fallbackExtension: string | null;
  }>;
  return rows.map((r) => ({
    ...r,
    members: db()
      .prepare(
        `SELECT extension_number AS number, priority FROM ring_group_members WHERE ring_group_id = ? ORDER BY priority, extension_number`,
      )
      .all(r.id) as Array<{ number: string; priority: number }>,
  }));
}

export function listPickupGroups() {
  const rows = db()
    .prepare(`SELECT id, name FROM pickup_groups ORDER BY name`)
    .all() as Array<{ id: number; name: string }>;
  return rows.map((r) => ({
    ...r,
    members: db()
      .prepare(`SELECT extension_number AS number FROM pickup_group_members WHERE pickup_group_id = ? ORDER BY extension_number`)
      .all(r.id) as Array<{ number: string }>,
  }));
}

export function listPhonebook(q = '') {
  if (!q.trim()) {
    return db()
      .prepare(`SELECT id, name, number, note FROM phonebook ORDER BY name LIMIT 500`)
      .all() as Array<{ id: number; name: string; number: string; note: string | null }>;
  }
  return searchPhonebook(db(), q);
}

export function listTimeRules() {
  return db()
    .prepare(`SELECT id, name, days, start_time AS startTime, end_time AS endTime, note FROM time_rules ORDER BY name`)
    .all() as Array<{ id: number; name: string; days: string; startTime: string; endTime: string; note: string | null }>;
}

export function listIvrMenus() {
  return db()
    .prepare(`SELECT id, number, name, max_retries AS maxRetries, wait_seconds AS waitSeconds FROM ivr_menus ORDER BY number`)
    .all() as Array<{ id: number; number: string; name: string | null; maxRetries: number; waitSeconds: number }>;
}

export function listGuidances() {
  return db()
    .prepare(`SELECT name, updated_at AS updatedAt FROM guidances ORDER BY name`)
    .all() as Array<{ name: string; updatedAt: string }>;
}

export function listCdr(limit = 200) {
  return db()
    .prepare(
      `SELECT uniqueid, start_at AS startTime, src, dst, billsec, disposition
       FROM cdr_records ORDER BY start_at DESC LIMIT ?`,
    )
    .all(limit) as Array<{
    uniqueid: string;
    startTime: string | null;
    src: string | null;
    dst: string | null;
    billsec: number;
    disposition: string | null;
  }>;
}

export function listIpAllowRows() {
  return db()
    .prepare(`SELECT cidr, note FROM ip_allow_list ORDER BY cidr`)
    .all() as Array<{ cidr: string; note: string | null }>;
}

export function listSipTrunks() {
  return db()
    .prepare(`SELECT name, host, port, username, did_inbound AS inboundDid FROM sip_trunks ORDER BY name`)
    .all() as Array<{ name: string; host: string; port: number; username: string | null; inboundDid: string | null }>;
}

export function listConcurrency(limit = 48) {
  return db()
    .prepare(`SELECT minute_at AS minuteAt, channels FROM concurrency_snapshots ORDER BY minute_at DESC LIMIT ?`)
    .all(limit) as Array<{ minuteAt: string; channels: number }>;
}

export async function listRecordingFiles(dir: string) {
  try {
    const names = await fs.readdir(dir);
    const wavs = names.filter((n) => n.endsWith('.wav'));
    const out: Array<{ name: string; size: number }> = [];
    for (const name of wavs.slice(0, 500)) {
      const st = await fs.stat(path.join(dir, name));
      out.push({ name, size: st.size });
    }
    return out.sort((a, b) => b.name.localeCompare(a.name));
  } catch {
    return [];
  }
}

export async function countInbox(dir: string) {
  try {
    const names = await fs.readdir(dir);
    return {
      wav: names.filter((n) => n.endsWith('.wav')).length,
      meta: names.filter((n) => n.endsWith('.meta.json')).length,
    };
  } catch {
    return { wav: -1, meta: -1 };
  }
}

export function getExtensions() {
  return listExtensions(db());
}

export function getHolidays() {
  return listHolidays(db());
}

export function getBillingRates() {
  return listBillingRates(db());
}

export function getVersionUpgrades() {
  return listVersionUpgrades(db());
}

export function getAuditLog(limit = 200) {
  return listAudit(db(), limit);
}

export function getLoginHistory(limit = 100) {
  return listLoginHistory(db(), limit);
}
