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
        'TLS 証明書が信頼されていません。ターミナルで mkcert -install（Mac パスワード入力）を実行するか、mkcert の rootCA.pem をキーチェーンで「常に信頼」に設定してから再試行してください。https://<host>:8089/ の Not Found 表示だけでは WSS が信頼されないことがあります。',
    };
  }
  if (/content.security.policy|content-security-policy|connect-src/i.test(m)) {
    return {
      kind: 'wss',
      userMessage:
        'WSS が Content-Security-Policy でブロックされています。connect-src に wss://<host>:8089 が含まれる buildSecurityHeaders をデプロイしてください。',
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
