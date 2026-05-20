# Security runbook（CSI / on-call）

ペネトレ台帳（F-xxx）とゲート ID（T-SEC-*）の対応は `docs/SECURITY-MAP.md`。  
再発防止の正本は `npm run harness`（= CI と同一）。

## 事前確認（デプロイ前）

```bash
npm run harness
npm run prod-check -- --expect-pass
npx tsx scripts/bootstrap-dev-admin.ts   # 開発: pbx-out + DB secret ローテート
```

本番: `IP_ALLOW_CIDRS` を設定、`INBOX_HMAC_SECRET` を設定、`AMI_SECRET` / `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` をローテート。  
SIP は `docker-compose.prod.yml` overlay でホスト非公開。

---

## SIP brute-force（F-001 / F-017）

**検出**: Asterisk `messages` の `Failed to authenticate` 連発、SIP 5060 へのスキャン。

**一次対応**

1. 送信元 IP をファイアウォールでブロック
2. `npm run prod-check` で T-PROD-005 / T-PROD-006 を確認
3. 影響内線の secret を UI でローテート

**根本**: 本番 SIP を VPN/SBC 裏に置く。DB に `ext-dev-*` が無いこと。追跡 `pjsip.d/extensions.conf` は `__OPENPBX_SYNC__` のみ（T-SEC-PJSIP-001）。

---

## AMI 異常 originate（F-006 / T-SEC-A10-001）

**検出**: `recordAudit` の originate 異常頻度、不自然な CDR。

**一次対応**

1. `asterisk/manager.conf` の `permit` を確認
2. `AMI_SECRET` ローテート、web/asterisk 再起動

**根本**: `validateOriginateRequest` / `ORIGINATE_ALLOWED_CONTEXTS`。Vitest: `originate-ami.test.ts`, `pentest-ch3-verification`.

---

## 録音 API 大量取得（F-004 / T-SEC-A01-002）

**検出**: audit の `recording.read` 急増。

**一次対応**

1. アカウントロールが supervisor 未満でないか確認
2. `ip_allow_list` 縮小

**根本**: `/api/recordings` は `withAuth` + `RECORDING_READ_MIN_ROLE`。`pentest-ch1-access.test.ts`.

---

## dialplan System() 不審行（F-007 / T-SEC-SHELL-001）

**検出**: `asterisk -rx "dialplan show"` で生の `CALLERID(name)` を System に渡す行。

**一次対応**

1. `data/pbx-out/dialplan.d` の更新時刻と git の差分確認
2. 不審なら `data/pbx-out` をスナップショットしてロールバック

**根本**: `SAFE_CALLER_NAME` + `shell/argv.ts`。gate: `checkDialplanShellSafety`.

---

## inbox meta 不正（F-009 / T-SEC-INBOX-001/002）

**検出**: ingest で `validateInboxMetaForIngest` 失敗ログ。

**一次対応**

1. `data/inbox` を保全
2. web の inbox マウント権限を見直す

**根本**: `inbox/validate-meta.ts` + 本番 `INBOX_HMAC_SECRET`（notify-event HMAC）。

---

## TOTP 再利用（F-013 / T-SEC-TOTP-001）

**検出**: 同一 TOTP コードの再試行、`verifyTotpConsuming` 二回目 false。

**一次対応**

1. 対象アカウントの TOTP 再登録
2. 他セッション破棄（ロール変更で `destroySessionsForAccount`）

**根本**: `totp-replay.test.ts`.

---

## CSRF / 管理画面 POST 異常（F-014 / T-SEC-CSRF-001/002）

**検出**: POST API 403 急増、Origin 不一致ログ。

**一次対応**

1. 正規管理画面 Origin のみ許可か確認
2. レガシークライアントは `Sec-Fetch-Site: same-origin` 必須

**根本**: `sec-csrf.test.ts`, `http/csrf.ts`.

---

## Web RCE → Asterisk 設定書換（F-002 / T-SEC-MOUNT-001）

**検出**: `data/pbx-out` 以外に pjsip/dialplan が書き換わった。

**一次対応**

1. compose が `data/pbx-out` のみマウントか確認（gate T-SEC-MOUNT-001）
2. 侵害 web コンテナ隔離

**根本**: web は git `asterisk/pjsip.d` を RW マウントしない。infra-sync のみ `PJSIP_OUT_DIR`.

---

## 本番 middleware 全拒否（F-008 / T-SEC-IP-001）

**検出**: 全リクエスト 403、middleware IP ログ。

**一次対応**

1. `IP_ALLOW_CIDRS` を compose に設定（CIDR 形式）
2. 開発のみ: `NODE_ENV` が production で空 CIDR → deny は意図動作

**根本**: `auth/middleware-ip-policy.ts` + `middleware-ip.test.ts`.

---

## ゲートが赤いとき

```bash
npm run check:static   # [T-xxx] 行を読む
npm run harness
```

ゲートを緩めない。契約変更は `denwa-architecture-gate.mjs` + 対応 Vitest を同時更新。
