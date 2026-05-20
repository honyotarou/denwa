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
  listBillingRatesForCost,
  listIpAllowRows as listIpAllowRowsRepo,
  listSipTrunksForUi,
  listConcurrencySnapshots,
  getPasswordPolicy,
  getNetworkSettings,
  listPatients,
  getPatient,
  listPatientRecords,
  listRecentPatientRecords,
  listClickToCallTokens,
  listGrantedExtensionNumbers,
} from '@openpbx/db';
import { enrichCdrRowsForUi, filterDueUpgrades, formatUpgradeRunCommands } from '@openpbx/core';
import { listRecordingFiles, countInboxFiles, listInboxEntries } from '@openpbx/infra';
import { getAppDb } from './app-context';
import { inboxDirectory, recordingsDirectory } from './paths';
import { getDashboardOnlineCount } from './services/dashboard';

function db() {
  return getAppDb();
}

export function listAccounts() {
  return listAccountsRepo(db());
}

export function listClickToCallTokensForAccount(accountId: number) {
  return listClickToCallTokens(db(), accountId);
}

export function listExtensionGrantsForAccount(accountId: number) {
  return listGrantedExtensionNumbers(db(), accountId);
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

export function listCdrForUi(limit = 200) {
  const rows = listCdrRecords(db(), limit);
  const rates = listBillingRatesForCost(db()).map((r) => ({
    prefix: r.prefix,
    perMin: r.perMin,
    setupFee: r.setupFee,
  }));
  return enrichCdrRowsForUi(rows, rates);
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

export async function listInboxForUi(limit = 50) {
  return listInboxEntries(inboxDirectory(), limit);
}

export async function getHomeSummary() {
  const { getAmiDeviceSession } = await import('./ports/ami-devices');
  const exts = getExtensions();
  const inbox = await countInboxSummary();
  const onlineDevices = getDashboardOnlineCount(getAmiDeviceSession());
  return {
    extensionCount: exts.length,
    extensions: exts,
    inbox,
    onlineDevices,
  };
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

export function getUpgradesForUi() {
  const scheduled = listVersionUpgrades(db());
  const nowIso = new Date().toISOString();
  const due = filterDueUpgrades(scheduled, nowIso).map((row) => ({
    ...row,
    commands: formatUpgradeRunCommands(row),
  }));
  return { scheduled, due };
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

export function getNetworkSettingsForUi() {
  return getNetworkSettings(db());
}

export function listPatientsForUi(query?: string) {
  return listPatients(db(), query);
}

export function getPatientForUi(id: string) {
  return getPatient(db(), id);
}

export function listPatientRecordsForUi(patientId: string) {
  return listPatientRecords(db(), patientId);
}

export function listRecentPatientRecordsForUi(limit = 20) {
  return listRecentPatientRecords(db(), limit);
}
