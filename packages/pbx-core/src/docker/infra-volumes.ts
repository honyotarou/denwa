/** Compose / infra 出力パス — F-002 Web→git asterisk RW 分離の単一正本 */

export const PBX_OUT_PJSIP_HOST = './data/pbx-out/pjsip.d' as const;
export const PBX_OUT_DIALPLAN_HOST = './data/pbx-out/dialplan.d' as const;

/** web が RW マウントしてはいけない git 管理の Asterisk 設定（F-002） */
export const WEB_FORBIDDEN_RW_ASTERISK_MOUNTS = [
  './asterisk/pjsip.d',
  './asterisk/dialplan.d',
] as const;

export function isForbiddenWebRwAsteriskVolume(volumeLine: string): boolean {
  const host = volumeLine.split(':')[0]?.trim() ?? '';
  for (const forbidden of WEB_FORBIDDEN_RW_ASTERISK_MOUNTS) {
    if (host === forbidden || host === `${forbidden}/`) return true;
  }
  return false;
}

export function webServiceMountsForbiddenAsteriskConfig(
  webVolumes: readonly string[] | undefined,
): readonly string[] {
  const vols = webVolumes ?? [];
  return vols.filter((v) => isForbiddenWebRwAsteriskVolume(v));
}
