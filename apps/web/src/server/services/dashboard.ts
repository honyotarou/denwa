import { countOnlineDevices } from '@openpbx/infra';
import type { AmiDeviceSession } from '@openpbx/infra/ami/device-session';

/** ホーム概要: AMI 未接続時は null（— 表示用） */
export function getDashboardOnlineCount(session: AmiDeviceSession): number | null {
  if (!session.isConnected()) return null;
  return countOnlineDevices(session.getDevices());
}
