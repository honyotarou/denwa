import type Database from 'better-sqlite3';

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
  maxRetries: number;
  waitSeconds: number;
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
  return db
    .prepare(
      `SELECT id, number, name, max_retries AS maxRetries, wait_seconds AS waitSeconds FROM ivr_menus ORDER BY number`,
    )
    .all() as IvrMenuListRow[];
}

export function listGuidanceNames(db: Database.Database) {
  return db
    .prepare(`SELECT name, updated_at AS updatedAt FROM guidances ORDER BY name`)
    .all() as Array<{ name: string; updatedAt: string }>;
}

export function listCdrRecords(db: Database.Database, limit = 200) {
  return db
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

export function listIpAllowRows(db: Database.Database) {
  return db
    .prepare(`SELECT cidr, note FROM ip_allow_list ORDER BY cidr`)
    .all() as Array<{ cidr: string; note: string | null }>;
}

export function listSipTrunksForUi(db: Database.Database) {
  return db
    .prepare(`SELECT name, host, port, username, did_inbound AS inboundDid FROM sip_trunks ORDER BY name`)
    .all() as Array<{ name: string; host: string; port: number; username: string | null; inboundDid: string | null }>;
}

export function listConcurrencySnapshots(db: Database.Database, limit = 48) {
  return db
    .prepare(`SELECT minute_at AS minuteAt, channels FROM concurrency_snapshots ORDER BY minute_at DESC LIMIT ?`)
    .all(limit) as Array<{ minuteAt: string; channels: number }>;
}
