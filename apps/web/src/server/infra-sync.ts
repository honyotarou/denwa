import type Database from 'better-sqlite3';
import {
  normalizeExtensionDraft,
  renderPjsipExtensions,
  renderRingGroupDialplan,
  renderPickupDialplan,
  renderIvrDialplan,
  renderBusinessHoursDialplan,
  renderTrunksDialplan,
  renderTrunksPjsipIfValid,
} from '@openpbx/core';
import {
  listExtensions,
  listRingGroupDrafts,
  listIvrMenuDrafts,
  loadBusinessHoursForInfra,
  listSipTrunksForInfra,
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
      const content = renderRingGroupDialplan(listRingGroupDrafts(db));
      await writeDialplanFile(dirs.dialplanDir, 'ringgroups.conf', content);
      await signalAsteriskReload(dirs.signalDir);
    },
    async syncPickup() {
      const content = renderPickupDialplan();
      await writeDialplanFile(dirs.dialplanDir, 'pickup.conf', content);
      await signalAsteriskReload(dirs.signalDir);
    },
    async syncIvr() {
      const content = renderIvrDialplan(listIvrMenuDrafts(db));
      await writeDialplanFile(dirs.dialplanDir, 'ivr.conf', content);
      await signalAsteriskReload(dirs.signalDir);
    },
    async syncBusinessHours() {
      const { rules, holidays } = loadBusinessHoursForInfra(db);
      const content = renderBusinessHoursDialplan(rules, holidays);
      await writeDialplanFile(dirs.dialplanDir, 'business-hours.conf', content);
      await signalAsteriskReload(dirs.signalDir);
    },
    async syncTrunks() {
      const trunks = listSipTrunksForInfra(db);
      const pjsip = renderTrunksPjsipIfValid(trunks);
      if (!pjsip) {
        throw new Error('invalid trunk configuration — refusing to write pjsip');
      }
      await writePjsipFile(dirs.pjsipDir, 'trunks.conf', pjsip);
      await writeDialplanFile(dirs.dialplanDir, 'trunks.conf', renderTrunksDialplan(trunks));
      await signalAsteriskReload(dirs.signalDir);
    },
  };
}

export type InfraSync = ReturnType<typeof createInfraSync>;
