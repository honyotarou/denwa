# Security map (CSI)

denwa のセキュリティ契約を **OWASP Top 10**・**静的ゲート ID**・**ITIL 改修区分**で対応づける。実装の単一正本は `packages/pbx-core`（純関数）と `apps/web/src/server`（アダプタ）に分離する。

## OWASP Top 10 ↔ ゲート / 実装

| OWASP | リスク | ゲート / テスト | 正本（例） |
|-------|--------|-----------------|------------|
| A01 Broken Access Control | 権限昇格・設定書き換え | T-SEC-A01-001〜003, T-ACT-028, `pentest-ch1-access` | `RECORDING_READ_MIN_ROLE`, `DEVICE_STREAM_MIN_ROLE`, `withAuth` |
| A02 Cryptographic Failures | 平文シークレット・弱 cookie | T-PROD-*, pentest cookie tests | `session-cookie.ts`, compose `${AMI_SECRET}` |
| A03 Injection | AMI/INI/CSV インジェクション | T-SEC-INI-001, T-SEC-CSV-001, T-SEC-AMI-001 | `ini/sanitize.ts`, `cdr/export.ts`, `originate/ami.ts` |
| A04 Insecure Design | web→Asterisk RW マウント・設計欠陥 | T-SEC-MOUNT-001, T-ACT-028 | `data/pbx-out`, login lockout |
| A05 Security Misconfiguration | 本番デフォルト秘密・AMI 0.0.0.0・HTTP 露出 | T-PROD-*, T-SEC-A05-001, `pentest-compose` | `docker-compose.yml`, `http.conf` loopback, prod-check |
| A06 Vulnerable Components | 依存 CVE・未 pin イメージ | T-SCA-001, T-SEC-IMG-001, **T-SEC-SCA-002**, **T-SEC-IMG-002**, harness | `package-lock.json`, `asterisk/Dockerfile`, `apps/web/Dockerfile` |
| A07 Auth Failures | ブルートフォース・セッション固定 | T-SEC-SESSION-001, EC-1 tests | `auth-login.ts`, `updateAccountRoleWithSession` |
| A08 Software/Data Integrity | 監査欠落・拡張改ざん・CI 改ざん・base image 改ざん | T-SEC-A09-001, **T-SEC-EXT-001/002**, **T-SEC-CI-001**, **T-SEC-IMG-002** | `audit-actions.ts`, sensitive API handlers, `chrome-extension/manifest.json`, `.github/workflows/`, Dockerfile |
| A09 Logging & Monitoring | 操作追跡 | T-SEC-A09-001, audit repo tests | `recordAudit`, CDR export audit |
| A10 SSRF | originate context 任意 dialplan | T-SEC-AMI-002 | `ORIGINATE_ALLOWED_CONTEXTS`, `originate/ami.ts` |

## TypeScript / アーキテクチャ（横断）

| ID | 内容 |
|----|------|
| T-ARCH-001〜006 | core 純粋・page-data・actions→services |
| T-SOC-001〜002 | 関心分離（web/lib に domain 禁止） |
| T-TS-001〜005 | class 禁止・Branded Type・Draft Readonly |
| T-SEC-CSRF-001 | POST API Origin（`http/csrf.ts` + route 門番） |
| T-SEC-CSV-001 | CDR CSV 数式インジェクション（`cdr/export.ts`） |
| T-SEC-SESSION-001 | 権限変更時セッション破棄・自己ローテート |
| T-SEC-AMI-001 | Originate AMI ヘッダ検証 |
| T-SEC-AMI-002 | Originate context 許可リスト |
| T-SEC-A01-002 | 録音 API supervisor+ |
| T-SEC-A01-003 | devices SSE withAuth + supervisor+ |
| T-SEC-A03-001 | guidances core validate 経由 |
| T-SEC-A05-001 | compose で 8088/8089 非公開 |
| T-SEC-A05-002 | `http.conf` loopback bind のみ |
| T-SEC-SHELL-001 | dialplan notify-event 引数（FILTER + notify-event.sh） |
| T-SEC-TOTP-001 | TOTP counter リプレイ拒否 |
| T-SEC-CSRF-002 | Origin 無し POST は Sec-Fetch-Site 必須 |
| T-SEC-INBOX-001 | inbox meta フィールド安全文字 |
| T-GAP-DOC-004 | softphone secret: admin 全件 / user は `account_extension_grants` の WebRTC 内線のみ |
| T-GAP-DOC-005 | click-to-call: Bearer token（hash 保存）/ cookie+Origin は拡張から使わない |
| T-GAP-SEC-003 | CDN `sip.js` 禁止 — npm `sip.js@0.21.2` のみ |
| T-SEC-HEADERS-001 | `buildSecurityHeaders` |
| T-SEC-PJSIP-001 | 追跡 `pjsip.d/extensions.conf` に既定平文 secret 禁止 |
| T-SEC-AST-001 | Asterisk Docker APT 版 pin |
| T-SEC-MOUNT-001 | web は `data/pbx-out` のみ RW（git asterisk/ 直マウント禁止） |
| T-SEC-INBOX-002 | inbox meta HMAC（`INBOX_HMAC_SECRET`） |
| T-SEC-IP-001 | 本番 middleware: `IP_ALLOW_CIDRS` 未設定なら deny |
| T-SEC-RTP-001 | `endpoint-internal` に `media_encryption=sdes` |
| T-SEC-IMG-001 | Asterisk Dockerfile APT pin（= T-SEC-AST-001） |
| T-SEC-A10-001 | originate context allowlist（= T-SEC-AMI-002） |
| T-SEC-CSRF-003 | 全 POST route が `rejectDisallowedPostOrigin` を呼ぶ静的検証（F-018） |
| T-SEC-SCA-002 | prod 依存 moderate+ ゼロ + postcss インストール pin（F-019） |
| T-SEC-SCA-003 | dev 依存 moderate+ ゼロ + esbuild/vite インストール pin（F-019 拡張） |
| T-SEC-EXT-001 | chrome 拡張 manifest の `host_permissions`/`matches` 最小化（F-020） |
| T-SEC-IMG-002 | Dockerfile `FROM` 行は digest `@sha256:` pin（F-021） |
| T-SEC-CI-001 | GitHub Actions の `uses:` は 40hex SHA pin（F-022） |
| T-SEC-RATE-001 | bearer / login / recording のアプリ層レートリミット（F-023） |
| T-SEC-EXT-002 | chrome 拡張 Bearer は `storage.local` 必須（F-024） |
| T-SEC-COMPOSE-002 | prod overlay 適用後 SIP/RTP/WS が外部公開 0 件（F-025） |
| T-SEC-RATE-002 | phonebook lookup / cdr export / patient records POST にもレート窓を追加（F-026） |
| T-SEC-RATE-003 | rate-limit store は TTL/LRU + 共有層化（IP rotation 緩和 + 無限増加防止）（F-027） |
| T-SEC-CSP-001 | CSP は `unsafe-inline` 廃止（RSC nonce）/ `connect-src` WSS ホスト allowlist / `frame-ancestors`・`base-uri`・`form-action` 明示（F-028） |
| T-SEC-SCA-004 | SBOM（CycloneDX/SPDX）+ GitHub artifact attestation / Docker provenance（F-029） |
| T-SEC-EXT-003 | chrome 拡張 content.js は `innerHTML` への web-page text 注入を architecture gate で禁止（F-030） |

## ITIL 改修区分（ペネトレ対応の整理）

| 区分 | 例 | denwa での扱い |
|------|-----|----------------|
| Emergency (EC) | ロックアウト・平文 secret | 即時テスト + prod-check |
| Normal (NC) | ヘッダ・API ロール・タイミング・INI・監査・AMI permit | handler/service + gate |
| Standard (SC) | SCA / prod-check 期待 | harness `sca-audit.mjs` |
| CSI（本ドキュメント） | 上記の地図・回帰 ID | 本ファイル + `denwa-architecture-gate.mjs` |

## ペネトレ台帳（Ch.3 再採点 → Ch.4 Treatment）

| ID | Ch.3 | Ch.4 契約 | 備考 |
|----|------|-----------|------|
| F-001 / F-017 | OPEN | **T-SEC-PJSIP-001** + T-PROD-005 | 追跡 `pjsip.d/extensions.conf` は `__OPENPBX_SYNC__` のみ。実 secret は bootstrap / infra sync |
| F-003 | CLOSED | T-SEC-A05-001 | compose HTTP 非公開 |
| F-004 | CLOSED | T-SEC-A01-002 | recording `withAuth` |
| F-005 | CLOSED | T-SEC-A01-003 | devices SSE `withAuth` |
| F-006 | CLOSED | T-SEC-AMI-002 | originate context allowlist |
| F-007 | OPEN→CLOSED | T-SEC-SHELL-001 | dialplan `SAFE_CALLER_NAME` + `sanitizeShellArgument` + notify-event 門番 |
| F-013 | OPEN→CLOSED | T-SEC-TOTP-001 | `verifyTotpConsuming` |
| F-014 | OPEN→CLOSED | T-SEC-CSRF-002 | Origin 無しは `Sec-Fetch-Site` 必須 |
| F-002 | OPEN→CLOSED | **T-SEC-MOUNT-001** | web/asterisk は `data/pbx-out/*` のみ RW。git `asterisk/pjsip.d` は追跡用プレースホルダ |
| F-015 | OPEN→CLOSED | **T-SEC-AST-001** | `asterisk/Dockerfile` APT pin |
| F-009 | OPEN→CLOSED | **T-SEC-INBOX-002** | `inbox/hmac.ts` + notify-event `INBOX_HMAC_SECRET` |
| F-008 | OPEN→CLOSED | **T-SEC-IP-001** + T-PROD-007 | 本番 middleware deny + DB allowlist |
| F-016 | OPEN→CLOSED | **T-SEC-RTP-001** | internal endpoint SDES |
| F-006 | CLOSED | **T-SEC-A10-001** | (= AMI-002 命名) |
| F-010 | Low | バックログ | 自己署名 WSS cert |
| F-018 | CLOSED | **T-SEC-CSRF-003** | `/api/patients/records` POST に Origin 門番配線済 |
| F-019 | CLOSED | **T-SEC-SCA-002/003** | overrides で postcss 8.5.10 / esbuild 0.25.12 / vite 6.4.2、allowlist なし |
| F-020 | CLOSED | **T-SEC-EXT-001** | chrome 拡張 host_permissions 最小化 |
| F-021 | CLOSED | **T-SEC-IMG-002** | Dockerfile base image digest pin |
| F-022 | CLOSED | **T-SEC-CI-001** | GH Actions SHA pin |
| F-023 | CLOSED | **T-SEC-RATE-001** | login / bearer / recording レートリミット |
| F-024 | CLOSED | **T-SEC-EXT-002** | Bearer を `chrome.storage.local` に保存 |
| F-025 | CLOSED | **T-SEC-COMPOSE-002** | prod overlay 後 telephony ポート外部公開 0 件 |
| F-026 | OPEN | **T-SEC-RATE-002** | phonebook lookup / cdr export / patient records POST に rate-limit 未配線（A04 / 2025 API4） |
| F-027 | OPEN | **T-SEC-RATE-003** | rate-limit store は in-proc Map（無限増加 + 水平スケール失効 + IP rotation 突破） |
| F-028 | OPEN | **T-SEC-CSP-001** | CSP `script-src 'self' 'unsafe-inline'` + `connect-src 'self' wss:` 全許可 + `frame-ancestors`/`base-uri`/`form-action` 未指定 |
| F-029 | OPEN | **T-SEC-SCA-004** | SBOM / GH attest-build-provenance / Docker provenance 未配線（2025 Supply Chain） |
| F-030 | OPEN→（in-flight 修正中） | **T-SEC-EXT-003** | 旧 `content.js` で `span.innerHTML = replacePhoneTextWithTelLinks(...)` の DOM XSS。in-flight branch で DOM createElement + textContent 化済（未コミット） |

## 変更時チェックリスト

1. ドメインルールは **core に Red→Green** してから web に配線する。
2. POST `/api/*` は `rejectDisallowedPostOrigin` を route で呼ぶ。
3. CDR ダウンロードは `buildCdrExportCsv` → `renderCdrExportCsv` のみ。
4. `updateAccountRole` は `destroySessionsForAccount` + 自己変更時 cookie 再発行。
5. Originate は `validateOriginateRequest` 経由で `callerId` / `context` を渡す。
6. マージ前に `npm run harness`。

## CSI 運用

| ドキュメント | 用途 |
|--------------|------|
| `docs/runbook-security.md` | インシデント一次対応（6 シナリオ + CSRF/mount/IP） |
| `docs/PENTEST-NEXT-SCOPE.md` | 次回 PT 再検証・新規バックログ |
| `packages/pbx-ops/src/__tests__/pentest-ch5-csi.test.ts` | CSI 回帰（compose / CI / gate 件数） |

参照: `docs/TDD-REBUILD-PLAN.md` §7、`scripts/denwa-architecture-gate.mjs`、`.cursor/skills/denwa/SKILL.md`。
