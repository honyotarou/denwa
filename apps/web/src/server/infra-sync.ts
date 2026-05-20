import type Database from 'better-sqlite3';
import {
  normalizeExtensionDraft,
  renderPjsipExtensions,
  renderRingGroupDialplan,
  renderPickupDialplan,
  renderIvrDialplan,
  renderBusinessHoursDialplan,
  renderTrunksDialplan,
  renderTrunksPjsip,
  type RingGroupDraft,
  type IvrMenuDraft,
} from '@openpbx/core';
import {
  listExtensions,
  createExtension,
  updateExtension,
  deleteExtension,
} from '@openpbx/db';
import { writeDialplanFile, writePjsipFile, signalAsteriskReload } from '@openpbx/infra';

export type InfraDirs = Readonly<{
  pjsipDir: string;
  dialplanDir: string;
  signalDir: string;
  soundsDir: string;
  recordingsDir: string;
}>;

export function createInfraSync(db: Database.Database, dirs: InfraDirs) {
  return {
    dirs,
    async syncPjsipExtensions() {
      const rows = listExtensions(db);
      const drafts = rows.map((r) =>
        normalizeExtensionDraft({
          number: r.number,
          displayName: r.displayName,
          secret: r.secret,
          webrtc: r.webrtc,
          pickupGroupNames: [],
        }),
      );
      const content = renderPjsipExtensions(drafts);
      await writePjsipFile(dirs.pjsipDir, 'extensions.conf', content);
      await signalAsteriskReload(dirs.signalDir);
    },
    async syncRingGroups() {
      const groups = loadRingGroups(db);
      const content = renderRingGroupDialplan(groups);
      await writeDialplanFile(dirs.dialplanDir, 'ringgroups.conf', content);
      await signalAsteriskReload(dirs.signalDir);
    },
    async syncPickup() {
      const content = renderPickupDialplan();
      await writeDialplanFile(dirs.dialplanDir, 'pickup.conf', content);
      await signalAsteriskReload(dirs.signalDir);
    },
    async syncIvr() {
      const menus = loadIvrMenus(db);
      const content = renderIvrDialplan(menus);
      await writeDialplanFile(dirs.dialplanDir, 'ivr.conf', content);
      await signalAsteriskReload(dirs.signalDir);
    },
    async syncBusinessHours() {
      const { rules, holidays } = loadBusinessHours(db);
      const content = renderBusinessHoursDialplan(rules, holidays);
      await writeDialplanFile(dirs.dialplanDir, 'business-hours.conf', content);
      await signalAsteriskReload(dirs.signalDir);
    },
    async syncTrunks() {
      const trunks = loadTrunks(db);
      await writePjsipFile(dirs.pjsipDir, 'trunks.conf', renderTrunksPjsip(trunks));
      await writeDialplanFile(dirs.dialplanDir, 'trunks.conf', renderTrunksDialplan(trunks));
      await signalAsteriskReload(dirs.signalDir);
    },
    extensions: {
      create: (input: Parameters<typeof createExtension>[1]) => createExtension(db, input),
      update: (input: Parameters<typeof updateExtension>[1]) => updateExtension(db, input),
      delete: (number: string) => deleteExtension(db, number),
      list: () => listExtensions(db),
    },
  };
}

export type InfraSync = ReturnType<typeof createInfraSync>;

function loadRingGroups(db: Database.Database): RingGroupDraft[] {
  const rows = db
    .prepare('SELECT id, number, name, strategy, ring_seconds, fallback_extension FROM ring_groups')
    .all() as Array<{
    id: number;
    number: string;
    name: string | null;
    strategy: string;
    ring_seconds: number;
    fallback_extension: string | null;
  }>;
  return rows.map((r) => ({
    number: r.number,
    name: r.name,
    strategy: r.strategy as RingGroupDraft['strategy'],
    ringSeconds: r.ring_seconds,
    fallbackExtension: r.fallback_extension,
    members: (
      db
        .prepare(
          'SELECT extension_number FROM ring_group_members WHERE ring_group_id = ? ORDER BY priority',
        )
        .all(r.id) as Array<{ extension_number: string }>
    ).map((m) => m.extension_number),
  }));
}

function loadIvrMenus(db: Database.Database): IvrMenuDraft[] {
  const menus = db.prepare('SELECT id, number, name FROM ivr_menus').all() as Array<{
    id: number;
    number: string;
    name: string | null;
  }>;
  return menus.map((m) => ({
    number: m.number,
    name: m.name,
    welcomePrompt: null,
    menuPrompt: null,
    invalidPrompt: null,
    goodbyePrompt: null,
    maxRetries: 3,
    waitSeconds: 6,
    options: (
      db
        .prepare('SELECT digit, action, target, label FROM ivr_options WHERE ivr_menu_id = ?')
        .all(m.id) as Array<{ digit: string; action: string; target: string | null; label: string | null }>
    ).map((o) => ({
      digit: o.digit,
      action: o.action as IvrMenuDraft['options'][number]['action'],
      target: o.target,
      label: o.label,
    })),
  }));
}

function loadBusinessHours(db: Database.Database) {
  const holidays = (
    db.prepare('SELECT date, name FROM holidays').all() as Array<{ date: string; name: string }>
  ).map((h) => ({ date: h.date, name: h.name }));
  const rules = (
    db
      .prepare('SELECT name, days, start_time, end_time FROM time_rules')
      .all() as Array<{ name: string; days: string; start_time: string; end_time: string }>
  ).map((r) => ({
    name: r.name,
    days: r.days,
    startTime: r.start_time,
    endTime: r.end_time,
  }));
  return { holidays, rules };
}

function loadTrunks(db: Database.Database) {
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
