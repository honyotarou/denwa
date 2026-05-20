/** PBX 設定変更 API の role 契約 — 単一正本 */

export type PbxRole = 'user' | 'supervisor' | 'admin';

/** 内線・IVR 音声など Asterisk 設定書込 */
export const PBX_CONFIG_WRITE_MIN_ROLE: PbxRole = 'supervisor';

/** 通話録音 DL（A01: user ロール全件取得を禁止） */
export const RECORDING_READ_MIN_ROLE: PbxRole = 'supervisor';

export const INBOX_READ_MIN_ROLE: PbxRole = 'user';

/** デバイス SSE（A01 / T-API-AUTH-001: withAuth 経由） */
export const DEVICE_STREAM_MIN_ROLE: PbxRole = 'supervisor';

/** Originate の dialplan context 許可リスト（A10） */
export const ORIGINATE_ALLOWED_CONTEXTS = ['internal'] as const;
