import {
  listExtensions,
  listHolidays,
  listBillingRates,
  listVersionUpgrades,
  listAudit,
  listLoginHistory,
  listPhonebookEntries,
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
  getPasswordPolicy,
} from '@openpbx/db';
import { listRecordingFiles, countInboxFiles } from '@openpbx/infra';
import { getAppDb } from './app-context';
import { inboxDirectory, recordingsDirectory } from './paths';

function db() {
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

export async function countInboxSummary() {
  return countInboxFiles(inboxDirectory());
}

export async function listRecordingsForUi() {
  return listRecordingFiles(recordingsDirectory());
}

export function listPhonebook(q = '') {
  if (!q.trim()) return listPhonebookEntries(db());
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

export function getPasswordPolicyForUi() {
  return getPasswordPolicy(db());
}
