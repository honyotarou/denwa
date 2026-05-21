import {
  listExtensions,
  listHolidays,
  listBillingRatesForUi,
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
  listDueUnappliedUpgrades,
  listIpAllowRows as listIpAllowRowsRepo,
  listSipTrunksForUi,
  listConcurrencySnapshots,
  getPasswordPolicy,
  getNetworkSettings,
  listPatients,
  getPatient,
  listPatientRecords,
  listRecentPatientRecordsSince,
  listClickToCallTokens,
  listGrantedExtensionNumbers,
  listRecordingFilesForUi,
  listInboxEventsForUi,
  listDeviceSnapshots,
  listCdrRecords,
} from '@openpbx/db';
import { formatUpgradeRunCommands } from '@openpbx/core';
import { countInboxFiles } from '@openpbx/infra';
import path from 'node:path';
import type { CdrListFilter } from '@openpbx/core';
import { getAppDb } from './app-context';
import { inboxDirectory } from './paths';
import { getBillingDetailForUi as loadBillingDetail } from './services/billing-detail';
import type { CdrSearchParams } from './services/cdr-list';
import { syncMediaIndexes } from './services/media-sync';

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

export async function listCdrForUi(limit = 200) {
  const { rows } = await listCdrForUiWithFilter({ limit });
  return rows;
}

export async function listCdrForUiWithFilter(sp: CdrSearchParams | CdrListFilter = {}) {
  const { listCdrForUiFiltered, cdrFilterFromSearchParams } = await import('./services/cdr-list');
  const filter =
    'limit' in sp && typeof sp.limit === 'number'
      ? sp
      : cdrFilterFromSearchParams(sp as CdrSearchParams);
  return listCdrForUiFiltered(db(), filter);
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
  const d = db();
  await syncMediaIndexes(d);
  return listInboxEventsForUi(d, limit);
}

export async function getHomeSummary() {
  const { getAmiDeviceSession } = await import('./ports/ami-devices');
  const {
    countInboxSummaryFromDir,
    getDeviceOnlineSummary,
    getPjsipExtensionsMtime,
    listExtensionsForHome,
  } = await import('./services/home-summary');
  const d = db();
  const exts = listExtensionsForHome(d);
  const inbox = await countInboxSummaryFromDir();
  const deviceSummary = getDeviceOnlineSummary(getAmiDeviceSession());
  const pjsipDir = process.env.PJSIP_OUT_DIR ?? path.join(process.cwd(), 'asterisk/pjsip.d');
  const extensionsMtime = await getPjsipExtensionsMtime(pjsipDir);
  return {
    extensionCount: exts.length,
    extensions: exts,
    inbox,
    deviceSummary,
    extensionsMtime,
  };
}

export async function getConcurrencyForUi(limit = 180) {
  const { getAmiDeviceSession } = await import('./ports/ami-devices');
  const { getConcurrencyUiData } = await import('./services/concurrency-ui');
  return getConcurrencyUiData(db(), getAmiDeviceSession(), limit);
}

export function getBillingDetailForUi(filter: CdrListFilter = {}) {
  return loadBillingDetail(db(), filter);
}

export async function listRecordingsForUi() {
  const d = db();
  await syncMediaIndexes(d);
  return listRecordingFilesForUi(d);
}

export function listDeviceSnapshotsForUi(limit = 24) {
  return listDeviceSnapshots(db(), limit);
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
  return listBillingRatesForUi(db());
}

export function getVersionUpgrades() {
  return listVersionUpgrades(db());
}

export function getUpgradesForUi() {
  const scheduled = listVersionUpgrades(db());
  const nowIso = new Date().toISOString();
  const due = listDueUnappliedUpgrades(db(), nowIso).map((row) => ({
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

export function listRecentPatientRecordsForUi(limit = 30, days = 14) {
  return listRecentPatientRecordsSince(db(), days, limit);
}
