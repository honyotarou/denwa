/** 端末状態の表示・reachable/state 同期（T-HOME-DEV-002） */

export type DeviceActivityState =
  | 'unknown'
  | 'not_inuse'
  | 'inuse'
  | 'busy'
  | 'invalid'
  | 'unavailable'
  | 'ringing'
  | 'ringinuse'
  | 'onhold';

const ACTIVITY_LABEL: Record<DeviceActivityState, string> = {
  unknown: '不明',
  not_inuse: '待機中',
  inuse: '通話中',
  busy: 'ビジー',
  invalid: '無効',
  unavailable: '利用不可',
  ringing: '呼出中',
  ringinuse: '呼出+通話',
  onhold: '保留',
};

/** AMI ContactStatus / ContactStatusDetail の Status 値 → reachable */
export function resolveContactReachable(status: string | undefined): boolean | null {
  if (!status) return null;
  if (status === 'Reachable' || status === 'Created' || status === 'Updated') return true;
  if (status === 'Unreachable' || status === 'Removed' || status === 'NonQualifiable') return false;
  return null;
}

/** ContactStatus と DeviceStateChange が別イベントのため、到達性で state を補正する */
export function reconcileStateWithReachability(
  state: DeviceActivityState,
  reachable: boolean | null,
): DeviceActivityState {
  if (reachable === true && state === 'unavailable') return 'not_inuse';
  if (reachable === false && (state === 'not_inuse' || state === 'unknown')) return 'unavailable';
  return state;
}

/** 通話状態バッジ（登録有無は registrationDisplayLabel で別表示） */
export function deviceActivityDisplayLabel(
  state: DeviceActivityState,
  reachable: boolean | null,
): string {
  if (state === 'unavailable') {
    if (reachable === false) return '到達不可';
    return 'オフライン';
  }
  return ACTIVITY_LABEL[state];
}

export function registrationDisplayLabel(reachable: boolean | null | undefined): string {
  return reachable === true ? '● 登録' : '○ 未登録';
}

export function registrationAriaLabel(reachable: boolean | null | undefined): string {
  return reachable === true ? '登録あり' : '登録なし';
}
