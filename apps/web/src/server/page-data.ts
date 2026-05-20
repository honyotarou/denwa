import type Database from 'better-sqlite3';
import {
  listExtensions,
  listHolidays,
  listBillingRates,
  listVersionUpgrades,
  listAudit,
  listLoginHistory,
  searchPhonebook,
  listAccounts as listAccountsRepo,
  listRingGroupsForUi,
  listPickupGroupsForUi,
  listTimeRules as listTimeRulesRepo,
  listIvrMenusForUi,
  listGuidanceNames,
  listCdrRecords,
  listIpAllowRows as listIpAllowRowsRepo,
  listSipTrunksForUi,
  listConcurrencySnapshots,
} from '@openpbx/db';
import { listRecordingFiles, countInboxFiles } from '@openpbx/infra';
import { getAppDb } from './app-context';

export function db(): Database.Database {
  return getAppDb();
}

export function listAccounts() {
  return listAccountsRepo(db());
}

export function listRingGroups() {
  return listRingGroupsForUi(db());
}

export function listPickupGroups() {
  return listPickupGroupsForUi(db());
}

export function listTimeRules() {
  return listTimeRulesRepo(db());
}

export function listIvrMenus() {
  return listIvrMenusForUi(db());
}

export function listGuidances() {
  return listGuidanceNames(db());
}

export function listCdr(limit = 200) {
  return listCdrRecords(db(), limit);
}

export function listIpAllowRows() {
  return listIpAllowRowsRepo(db());
}

export function listSipTrunks() {
  return listSipTrunksForUi(db());
}

export function listConcurrency(limit = 48) {
  return listConcurrencySnapshots(db(), limit);
}

export { listRecordingFiles, countInboxFiles as countInbox };

export function listPhonebook(q = '') {
  if (!q.trim()) {
    return db()
      .prepare(`SELECT id, name, number, note FROM phonebook ORDER BY name LIMIT 500`)
      .all() as Array<{ id: number; name: string; number: string; note: string | null }>;
  }
  return searchPhonebook(db(), q);
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
