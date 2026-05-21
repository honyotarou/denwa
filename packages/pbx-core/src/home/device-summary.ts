/** 端末オンライン集計（T-HOME-DEV-001） */

export type DeviceReachability = Readonly<{
  extension: string | null;
  reachable: boolean | null;
  state: string;
}>;

export function summarizeDeviceOnline(
  devices: readonly DeviceReachability[],
): { online: number; total: number } {
  const pjsip = devices.filter((d) => d.extension);
  const total = pjsip.length;
  const online = pjsip.filter(
    (d) => d.reachable === true || d.state === 'not_inuse' || d.state === 'inuse',
  ).length;
  return { online, total };
}
