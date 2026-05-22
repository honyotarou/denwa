/** Nav 表示ポリシー — UI と API role 契約の橋渡し */

import {
  DEVICE_STREAM_MIN_ROLE,
  RECORDING_READ_MIN_ROLE,
  roleMeetsMin,
  type PbxRole,
} from '@openpbx/core/auth/pbx-api-policy';

export type NavRole = PbxRole;

export function showNetworkLink(role: NavRole): boolean {
  return role === 'admin';
}

export function showPatientsLink(_role: NavRole): boolean {
  return true;
}

export function showTriageLink(_role: NavRole): boolean {
  return true;
}

export function showDevicesLink(role: NavRole): boolean {
  return roleMeetsMin(role, DEVICE_STREAM_MIN_ROLE);
}

export function showRecordingsLink(role: NavRole): boolean {
  return roleMeetsMin(role, RECORDING_READ_MIN_ROLE);
}
