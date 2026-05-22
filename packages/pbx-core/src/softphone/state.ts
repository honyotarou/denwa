/** ソフトフォン UI 状態機械（T-SOFT-*）— SipAdapter と分離 */

export type SoftphoneUiState =
  | 'disconnected'
  | 'registering'
  | 'registered'
  | 'incoming'
  | 'inCall'
  | 'error';

export function nextStateOnRegisterClick(current: SoftphoneUiState): SoftphoneUiState {
  if (current === 'disconnected' || current === 'error') return 'registering';
  return current;
}

export function nextStateOnRegisterOk(): SoftphoneUiState {
  return 'registered';
}

export function nextStateOnRegisterFail(): SoftphoneUiState {
  return 'error';
}

export function nextStateOnIncoming(): SoftphoneUiState {
  return 'incoming';
}

export function nextStateOnDialClick(current: SoftphoneUiState): SoftphoneUiState {
  if (current === 'registered') return 'inCall';
  return current;
}

export function nextStateOnHangup(current: SoftphoneUiState): SoftphoneUiState {
  if (current === 'inCall' || current === 'incoming') return 'registered';
  return current;
}

export function nextStateOnUnregister(current: SoftphoneUiState): SoftphoneUiState {
  return 'disconnected';
}

export function validateDialTarget(target: string): string | null {
  const t = (target ?? '').trim();
  if (!/^\d{2,6}$/.test(t)) return '発信先は 2〜6 桁の数字';
  return null;
}

/** UI 表示用（OpenPBX 互換ラベル） */
export function softphoneStatusLabel(state: SoftphoneUiState): string {
  switch (state) {
    case 'disconnected':
      return '未接続';
    case 'registering':
      return '接続中…';
    case 'registered':
      return '登録完了';
    case 'incoming':
      return '着信中';
    case 'inCall':
      return '通話中';
    case 'error':
      return 'エラー';
  }
}
