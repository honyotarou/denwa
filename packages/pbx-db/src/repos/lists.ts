import type Database from 'better-sqlite3';
import { listCdrRecordsFiltered } from './cdr.js';
import { getIvrMenu } from './ivr.js';
import { listSipTrunks, type SipTrunkRow } from './sip-trunks.js';

export type AccountListRow = Readonly<{
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  updatedAt: string;
}>;

export type RingGroupListRow = Readonly<{
  id: number;
  number: string;
  name: string | null;
  strategy: string;
  ringSeconds: number;
  fallbackExtension: string | null;
  members: readonly { number: string; priority: number }[];
}>;

export type PickupGroupListRow = Readonly<{
  id: number;
  name: string;
  members: readonly { number: string }[];
}>;

export type IvrMenuListRow = Readonly<{
  id: number;
  number: string;
  name: string | null;
  welcomePrompt: string | null;
  menuPrompt: string | null;
  invalidPrompt: string | null;
  goodbyePrompt: string | null;
  maxRetries: number;
  waitSeconds: number;
  options: readonly { digit: string; action: string; target: string | null; label: string | null }[];
}>;

export function listAccounts(db: Database.Database): readonly AccountListRow[] {
  return db
    .prepare(
      `SELECT id, username, display_name AS displayName, role, updated_at AS updatedAt FROM accounts ORDER BY username`,
    )
    .all() as AccountListRow[];
}

export function listRingGroupsForUi(db: Database.Database): readonly RingGroupListRow[] {
  const rows = db
    .prepare(
      `SELECT id, number, name, strategy, ring_seconds AS ringSeconds, fallback_extension AS fallbackExtension FROM ring_groups ORDER BY number`,
    )
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
    members: db
      .prepare(
        `SELECT extension_number AS number, priority FROM ring_group_members WHERE ring_group_id = ? ORDER BY priority, extension_number`,
      )
      .all(r.id) as Array<{ number: string; priority: number }>,
  }));
}

export function listPickupGroupsForUi(db: Database.Database): readonly PickupGroupListRow[] {
  const rows = db.prepare(`SELECT id, name FROM pickup_groups ORDER BY name`).all() as Array<{
    id: number;
    name: string;
  }>;
  return rows.map((r) => ({
    ...r,
    members: db
      .prepare(
        `SELECT extension_number AS number FROM pickup_group_members WHERE pickup_group_id = ? ORDER BY extension_number`,
      )
      .all(r.id) as Array<{ number: string }>,
  }));
}

export function listTimeRules(db: Database.Database) {
  return db
    .prepare(
      `SELECT id, name, days, start_time AS startTime, end_time AS endTime, note FROM time_rules ORDER BY name`,
    )
    .all() as Array<{
    id: number;
    name: string;
    days: string;
    startTime: string;
    endTime: string;
    note: string | null;
  }>;
}

export function listIvrMenusForUi(db: Database.Database): readonly IvrMenuListRow[] {
  const numbers = db.prepare('SELECT number FROM ivr_menus ORDER BY number').all() as Array<{ number: string }>;
  return numbers
    .map((r) => getIvrMenu(db, r.number))
    .filter((m): m is NonNullable<typeof m> => m != null);
}

export function listGuidanceNames(db: Database.Database) {
  return db
    .prepare(`SELECT name, updated_at AS updatedAt FROM guidances ORDER BY name`)
    .all() as Array<{ name: string; updatedAt: string }>;
}

export function listCdrRecords(db: Database.Database, limit = 200) {
  return listCdrRecordsFiltered(db, { limit });
}

export function listIpAllowRows(db: Database.Database) {
  return db
    .prepare(`SELECT cidr, note FROM ip_allow_list ORDER BY cidr`)
    .all() as Array<{ cidr: string; note: string | null }>;
}

export function listSipTrunksForUi(db: Database.Database): SipTrunkRow[] {
  return listSipTrunks(db);
}

export function listConcurrencySnapshots(db: Database.Database, limit = 48) {
  return db
    .prepare(`SELECT minute_at AS minuteAt, channels FROM concurrency_snapshots ORDER BY minute_at DESC LIMIT ?`)
    .all(limit) as Array<{ minuteAt: string; channels: number }>;
}
