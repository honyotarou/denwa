import type Database from 'better-sqlite3';
import type { IvrMenuDraft, RingGroupDraft } from '@openpbx/core';
import { toIvrMenuDraft } from '@openpbx/core';
import { getRingGroup } from './ring-groups.js';
import { getIvrMenu } from './ivr.js';

export function listRingGroupDrafts(db: Database.Database): RingGroupDraft[] {
  const rows = db
    .prepare('SELECT number FROM ring_groups ORDER BY number')
    .all() as Array<{ number: string }>;
  return rows
    .map((r) => getRingGroup(db, r.number))
    .filter((g): g is NonNullable<typeof g> => g != null)
    .map((g) => ({
      number: g.number,
      name: g.name,
      strategy: g.strategy as RingGroupDraft['strategy'],
      ringSeconds: g.ringSeconds,
      fallbackExtension: g.fallbackExtension,
      members: [...g.members],
    }));
}

export function listIvrMenuDrafts(db: Database.Database): IvrMenuDraft[] {
  const rows = db.prepare('SELECT number FROM ivr_menus ORDER BY number').all() as Array<{ number: string }>;
  return rows
    .map((r) => getIvrMenu(db, r.number))
    .filter((m): m is NonNullable<typeof m> => m != null)
    .map((m) =>
      toIvrMenuDraft({
        number: m.number,
        name: m.name,
        welcomePrompt: m.welcomePrompt,
        menuPrompt: m.menuPrompt,
        invalidPrompt: m.invalidPrompt,
        goodbyePrompt: m.goodbyePrompt,
        maxRetries: m.maxRetries,
        waitSeconds: m.waitSeconds,
        options: m.options.map((o) => ({
          digit: o.digit,
          action: o.action as IvrMenuDraft['options'][number]['action'],
          target: o.target,
          label: o.label,
        })),
      }),
    );
}

export function loadBusinessHoursForInfra(db: Database.Database) {
  const holidays = (
    db.prepare('SELECT date, name FROM holidays').all() as Array<{ date: string; name: string }>
  ).map((h) => ({ date: h.date, name: h.name }));
  const rules = (
    db.prepare('SELECT name, days, start_time, end_time FROM time_rules').all() as Array<{
      name: string;
      days: string;
      start_time: string;
      end_time: string;
    }>
  ).map((r) => ({
    name: r.name,
    days: r.days,
    startTime: r.start_time,
    endTime: r.end_time,
  }));
  return { holidays, rules };
}

export function listSipTrunksForInfra(db: Database.Database) {
  return (
    db
      .prepare(
        'SELECT name, host, port, username, secret, registration, from_user, from_domain, did_inbound, outbound_prefix FROM sip_trunks',
      )
      .all() as Array<{
      name: string;
      host: string;
      port: number;
      username: string | null;
      secret: string | null;
      registration: number;
      from_user: string | null;
      from_domain: string | null;
      did_inbound: string | null;
      outbound_prefix: string | null;
    }>
  ).map((t) => ({
    name: t.name,
    host: t.host,
    port: t.port,
    username: t.username,
    secret: t.secret,
    registration: !!t.registration,
    fromUser: t.from_user,
    fromDomain: t.from_domain,
    didInbound: t.did_inbound,
    outboundPrefix: t.outbound_prefix,
  }));
}
