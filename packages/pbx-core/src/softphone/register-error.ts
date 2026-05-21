/** SIP 登録失敗メッセージの分類（T-SOFT-005/007 — UI 表示用） */

export type SipRegisterFailureKind = 'cert' | 'wss' | 'auth' | 'media' | 'unknown';

export type SipRegisterFailure = Readonly<{
  kind: SipRegisterFailureKind;
  userMessage: string;
}>;

export function classifySipRegisterFailure(raw: string): SipRegisterFailure {
  const m = (raw ?? '').toLowerCase();
  if (
    /certificate|cert|ssl|tls|self[- ]?signed|unable to verify|sec_error|net::err_cert/i.test(
      m,
    )
  ) {
    return {
      kind: 'cert',
      userMessage:
        'TLS 証明書が信頼されていません。開発時は ./scripts/gen-dev-asterisk-certs.sh のあと https://<host>:8089/ を一度開いて承認してください。',
    };
  }
  if (/websocket|wss|econnrefused|failed to connect|network|timeout|8089/i.test(m)) {
    return {
      kind: 'wss',
      userMessage:
        'WSS (8089) に接続できません。docker-compose.softphone-dev.yml で asterisk を起動し、8089 が届くことを確認してください。',
    };
  }
  if (/401|403|unauthorized|forbidden|wrong password|digest/i.test(m)) {
    return {
      kind: 'auth',
      userMessage: 'SIP 認証に失敗しました。内線番号・secret・WebRTC 割当を確認してください。',
    };
  }
  if (/notallowed|permission|getusermedia|microphone/i.test(m)) {
    return {
      kind: 'media',
      userMessage: 'マイク権限が拒否されました。ブラウザのサイト設定でマイクを許可してください。',
    };
  }
  return {
    kind: 'unknown',
    userMessage: raw?.trim() || 'SIP 登録に失敗しました',
  };
}
