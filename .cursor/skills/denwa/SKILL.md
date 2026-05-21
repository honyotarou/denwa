---
name: denwa
description: >-
  OpenPBX TDD 再構築（/denwa）。0→9。legacy parity B（CDR検索・課金明細・同時通話等）は steps 付録 D。
  SOC/カプセル化/T-TS(§5.4.1)/T-SEC(ペネトレ)は denwa-architecture-gate + Vitest + prod-check で強制。
  層: core / ops / db / infra / web(services→actions→pages)。pre static / post harness:fast / push harness。test:coverage:parity-b。
  Use when: /denwa, denwa, parity B, pentest, OWASP, ITIL, T-ARCH, T-SOC, T-SEC, T-TS, harness, legacy OpenPBX, SECURITY-MAP.
  正本 .cursor/skills/denwa。手順 steps-denwa.md。地図 docs/SECURITY-MAP.md。
---

# denwa — OpenPBX TDD 再構築（`/denwa`）

**正本**: 本 SKILL → **`steps-denwa.md` §{番号}`**（レガシー parity B → **付録 D**）→ `docs/TDD-REBUILD-PLAN.md` / **`docs/SECURITY-MAP.md`**

**番号だけでよい**。`harness` / `check` は独立メニューにしない。編集時 **pre→static** / **post→harness:fast**、turn 末 **stop→harness**、push で **harness**。

> **SOC・カプセル化・TypeScript 規約（§5.4.1）は「推奨」ではない。**  
> `scripts/denwa-architecture-gate.mjs`（`npm run check:static`）+ Vitest（`typescript-gate.test.ts` / `no-class.test.ts` / `brands.test.ts` / `import-boundaries.test.ts`）が **二重**で強制。  
> ゲートが赤 → **コードを直す**。ルールを緩めない（意図的な設計変更は gate と Vitest を同時に更新）。

---

## 1. メニュー

```
  0   基盤・フック          npm install / Hooks / T-XXX 1 件
  1   legacy + golden      ../OpenPBX 読取・T-GM-*
  2   ドメイン TDD           @openpbx/core（pure のみ）
  3   早期 smoke             asterisk / docker
  4   DB                     @openpbx/db repos
  5   Infra                  @openpbx/infra
  6   API / Actions          services + actions + routes
  7   フロント               FRONTEND-PLAN
  8   本番化                 @openpbx/ops / prod-check
  9   commit / push          §check
```

### 門番（自動）

| 操作 | 門番 |
|------|------|
| Step 2〜8 で Write/Edit | pre → `check:static`（secrets + **architecture gate**）/ post → `harness:fast` |
| turn 終了 | stop → `npm run harness` |
| `git commit` | lefthook → `harness:fast` |
| `git push` | lefthook → `npm run harness` |
| GitHub Actions | `npm run harness`（pre-push と同一: prod-check + SCA 含む） |

| コマンド | 内容 |
|----------|------|
| `npm run check:static` | `scripts/check-denwa-static.mjs` → secrets + `denwa-architecture-gate.mjs` |
| `npm run harness:fast` | static + 全 workspace typecheck |
| `npm run harness` | fast + `test:gate` + `prod-check --expect-pass` + `sca-audit` |
| `npm run test:coverage:parity-b` | `@openpbx/core` の parity B 6 モジュール branch ≥90%（`vitest --coverage`） |

編集 **1 ファイル** 時も pre/post で該当ルールのみ再検査（`check:static -- <path>`）。

---

## 2. 強制マトリクス（契約 ID → 門番）

実装: **`scripts/denwa-architecture-gate.mjs`**（static）、**`import-boundaries.test.ts`** 他 Vitest（`test:gate`）。

| ID | 何を守るか | static | Vitest |
|----|------------|:------:|:------:|
| T-ARCH-001 | `pbx-core` に `node:fs` / `child_process` なし | ✓ | ✓ |
| T-ARCH-002 | `page.tsx` に db / `getAppDb` なし | ✓ | ✓ |
| T-ARCH-003 | page に `process.env` / `node:path` なし。`page-data` に SQL / `export db()` なし | ✓ | ✓ |
| T-ARCH-004 | domain mutation `services/*` が core `validate*` を使う | ✓ | ✓ |
| T-ARCH-005 | `pbx-db` が `@openpbx/ops` に依存しない | ✓ | ✓ |
| T-ARCH-006 | 移行済み `server/actions/*` が `ctx.db` / `ctx.infra.sync*` 直叩きしない | ✓ | ✓ |
| T-API-IP-001 | API route が `buildContextFromRequest(req)`（health 除く） | ✓ | ✓ |
| T-API-AUTH-001 | API handler が `withAuth` で認可（手書き try/catch 重複を避ける） | — | ✓ |
| T-MW-007 | middleware が `clientIpForMiddleware`（`ipAllowed=true` 固定禁止） | ✓ | ✓ |
| T-MW-008 | middleware が `request-meta` / `app-context` / core バレルを import しない | ✓ | — |
| T-INFRA-TRUNK-001 | `infra-sync` が `renderTrunksPjsipIfValid` | ✓ | ✓ |
| T-SOC-001 | `infra-sync` に extensions CRUD ネスト禁止 | ✓ | — |
| T-SOC-002 | `apps/web/src/lib` に domain（validate/render 等）禁止 | ✓ | — |
| T-SOC-003 | `services/*` が `actions/*` を import しない（audit は `server/audit.ts`） | ✓ | ✓ |
| T-SOC-004 | `app/actions.ts` は barrel のみ（実装は `app/actions/<domain>.ts`） | ✓ | ✓ |
| T-SOC-005 | `api-handlers.ts` は barrel のみ（実装は `server/api/handlers/*`） | ✓ | ✓ |
| T-PKG-001 | `server/actions/**` と `server/api/handlers/**` で `@openpbx/db` / `@openpbx/infra` **バレル禁止**（subpath のみ） | ✓ | ✓ |
| T-FORM-001 | Form field 名は `server/actions/forms/*` に単一正本（例: `extension-form.ts`） | — | ✓ |
| T-ACT-021 | ログインは `services/auth-login.authenticateLogin`（TOTP 含む） | — | ✓ |
| T-SEC-001 | `TRUSTED_PROXY_COUNT=0` で XFF 無視。>0 なら chain 右端（`request-ip.ts`） | — | ✓ |
| T-SEC-002 | 本番 session cookie `secure: true`（`session-cookie.ts`） | — | ✓ |
| T-SEC-003 | ログイン `next` は `safeRedirectPath`（相対パスのみ） | — | ✓ |
| T-SEC-004 | AMI: 172.16.0.0/12、`write` に `command` なし | — | ✓ (ops) |
| T-SEC-INI-001 | PJSIP displayName は `sanitizeIniDisplayName` のみ | ✓ | — |
| T-SEC-PJSIP-001 | 追跡 `pjsip.d/extensions.conf` に ext-dev/secret-100x 禁止 | ✓ | ✓ (pjsip-tracked-secrets) |
| T-SEC-AST-001 | Asterisk Docker APT 版 pin（= T-SEC-IMG-001） | ✓ | ✓ (pentest-ch4/ch5) |
| T-SEC-IMG-001 | `asterisk/Dockerfile` `asterisk=${ASTERISK_PKG_VERSION}` | ✓ | ✓ |
| T-SEC-MOUNT-001 | web は `data/pbx-out` のみ（git `asterisk/pjsip.d` RW 禁止） | ✓ | ✓ (pentest-mount) |
| T-SEC-RTP-001 | `endpoint-internal` SDES (`transports.conf`) | ✓ | ✓ (pentest-rtp) |
| T-SEC-IP-001 | 本番 middleware: 空 `IP_ALLOW_CIDRS` → deny | ✓ | ✓ (middleware-ip) |
| T-SEC-A05-002 | `http.conf` bindaddr/tlsbindaddr loopback のみ | ✓ | ✓ (asterisk-http-bind) |
| T-SEC-A10-001 | originate context allowlist（= T-SEC-AMI-002） | — | ✓ (pentest-ch3) |
| T-SEC-INBOX-002 | inbox meta HMAC（`inbox/hmac.ts` + notify-event） | — | ✓ |
| T-SEC-A01-001 | PBX 書込 API は `PBX_CONFIG_WRITE_MIN_ROLE` | ✓ | ✓ |
| T-SEC-A01-002 | 録音 API は `RECORDING_READ_MIN_ROLE` + `withAuth` | ✓ | ✓ (ch1-access) |
| T-SEC-A01-003 | devices SSE は `DEVICE_STREAM_MIN_ROLE` + `withAuth` | ✓ | ✓ (ch1-access) |
| T-SEC-A09-001 | 機微 API は `recording.read` 等を audit | ✓ | — |
| T-SEC-HEADERS-001 | `next.config` → `buildSecurityHeaders` | ✓ | ✓ |
| T-SEC-CSRF-001 | POST API route → `rejectDisallowedPostOrigin` | ✓ | ✓ (sec-csrf) |
| T-SEC-CSRF-002 | Origin 無し POST は `Sec-Fetch-Site` 必須（core `csrf.ts`） | — | ✓ (sec-csrf) |
| T-SEC-CSV-001 | CDR export は `renderCdrExportCsv` 経由のみ | ✓ | ✓ (cdr-export) |
| T-SEC-SESSION-001 | ロール変更で `destroySessionsForAccount` + 自己 cookie | ✓ | ✓ |
| T-SEC-AMI-001 | originate は `validateOriginateRequest`（callerId/context） | ✓ | ✓ |
| T-SEC-AMI-002 | originate `context` は `ORIGINATE_ALLOWED_CONTEXTS` のみ | — | ✓ (originate-ami) |
| T-SEC-A03-001 | guidances は core `validateGuidanceName` / `validateWavHeader` | ✓ | — |
| T-SEC-SHELL-001 | dialplan `SAFE_CALLER_NAME`（`CALLERID(name)` を System に渡さない） | ✓ | ✓ (shell-argv) |
| T-SEC-INBOX-001 | inbox meta は `validateInboxMetaShape`（core） | — | ✓ |
| T-SEC-TOTP-001 | TOTP は `verifyTotpConsuming` + `totp_last_counter` | — | ✓ |
| T-SEC-A05-001 | compose で Asterisk HTTP 8088/8089 ホスト非公開 | — | ✓ (prod-check / pentest-compose) |
| T-TS-001 | Branded Type（`ExtensionNumber` ≠ `IvrNumber`）。`brands.ts` + `parse*` / `to*` | ✓ | ✓ |
| T-TS-002 | データ型 `Readonly<{…}>`。`*DraftInput` は string 境界可 | ✓ | ✓ |
| T-TS-003 | `export class` / `class extends Error` 禁止 — tag + factory | ✓ | ✓ |
| T-TS-004 | カスタム `*Error` への `instanceof` / `new XxxError()` 禁止 | ✓ | ✓ |
| T-TS-005 | `services/extensions`・`services/ivr` は `validate*` → `to*Draft` 必須 | ✓ | — |

**ゲートが赤いとき**: まず `npm run check:static` の `[T-xxx]` 行を読む → 該当ファイルを修正 → `npm run harness:fast`。

---

## 2b. TypeScript 規約（§5.4.1 / t-wada）— 強制

Java/C# とは異なり **構造的部分型**。型注釈は実行時に消える → **class / instanceof に頼らない**。

| やること | 正本パス | 門番 |
|----------|----------|------|
| Branded 値 | `packages/pbx-core/src/brands.ts` | T-TS-001 |
| 入力→正規化→検証→brand | `normalize*` → `validate*` → `to*Draft` | T-TS-005 (services) |
| エラー tag | `xxxError()` + `isXxxError(e)` | T-TS-003/004 |
| Draft 型 | `Readonly<{ number: ExtensionNumber; … }>` | T-TS-002 |

### データフロー（内線の例）

```text
Form/API string
  → ExtensionDraftInput
  → normalizeExtensionDraft
  → validateExtensionDraft
  → toExtensionDraft  （ExtensionNumber）
  → render / DB / audit
```

### ゲート赤の直し方（T-TS）

| ID | 症状 | 修正 |
|----|------|------|
| T-TS-001 | `ExtensionDraft.number` が string | `brands.ts` の `ExtensionNumber` + `toExtensionDraft` |
| T-TS-002 | `export type FooDraft = {` | `Readonly<{ … }>` に変更 |
| T-TS-003 | `export class` / `class extends Error` | tag 付き factory + `isXxxError` |
| T-TS-004 | `instanceof DuplicateError` | `isDuplicateError(e)` |
| T-TS-005 | services が brand 化しない | `validate*` 後に `toExtensionDraft` / `toIvrMenuDraft` |

新 Branded 値を足すとき: `brands.ts` に `parse*` → core `to*Draft` → `BRAND_BOUNDARY_SERVICES`（要 brand 化 service）→ `brands.test.ts` に type-level テスト。

---

## 2c. セキュリティ契約（T-SEC / ペネトレ）— 強制

**地図**: `docs/SECURITY-MAP.md`（OWASP ↔ ゲート ID ↔ ITIL EC/NC/CSI）。

**ルール**: ドメイン検証・CSV/CSRF/AMI/context/shell は **`packages/pbx-core` に Red→Green** → web/asterisk は薄いアダプタのみ。ゲート赤は **緩めない**（意図変更は gate + 対応 Vitest を同時更新）。

### 正本パス（追加時はここを増やす）

| 関心 | core | web / infra |
|------|------|-------------|
| API ロール契約 | `auth/pbx-api-policy.ts` | handlers が `RECORDING_READ_MIN_ROLE` 等を参照 |
| CSRF | `http/csrf.ts` | `server/api/post-origin.ts` + 各 POST `route.ts` |
| CDR CSV | `cdr/export.ts` | `services/cdr-export.ts` → `handlers/cdr.ts` |
| Originate AMI | `originate/ami.ts` | `handlers/originate.ts` |
| Shell 引数 | `shell/argv.ts` | `asterisk/extensions.conf` + `notify-event.sh` |
| inbox meta | `inbox/validate-meta.ts` | `infra/inbox/validate-meta.ts` は委譲 |
| TOTP リプレイ | `auth/totp.ts` `verifyTotpConsuming` | `auth.ts` + `accounts.totp_last_counter` |
| 本番 compose | — | `docker-compose.prod.yml`（SIP 非公開 overlay） |

### ペネトレ（ITIL）の進め方

ユーザーが **ペネトレ / OWASP / ITIL** と言ったときは **`steps-denwa.md` 付録 C** に従う。

| 章 | やること | 実装 |
|----|----------|------|
| 1 Identification | 攻撃面台帳 | 修正しない |
| 2 Threat Modeling | STRIDE × L×I | 修正しない |
| 3 Verification | 再現確認 | **新規 Red は書かない**（`pentest-ch3-verification.test.ts` は緩和の静的確認） |
| 4 Treatment | TDD 修正 | core → service/handler → gate |
| 5 CSI | 回帰 | `npm run harness` + `SECURITY-MAP.md` |

### 新規 API / 変更時（セキュリティ）

1. [ ] POST route に `rejectDisallowedPostOrigin`（T-SEC-CSRF-001）
2. [ ] 機微 GET に `withAuth` + `pbx-api-policy` の `minRole`（T-SEC-A01-002/003）
3. [ ] 監査 action を `audit-actions.ts` に追加（T-SEC-A09-001）
4. [ ] PBX 書込は `PBX_CONFIG_WRITE_MIN_ROLE`（T-SEC-A01-001）
5. [ ] ドメイン文字列検証は core にテスト付きで追加

---

## 3. アーキテクチャ

```text
pbx-core     pure domain + prod/findings          T-ARCH-001
pbx-ops      compose・conf・inbox・prod/check     I/O
pbx-db       schema + repos（ops に依存しない）   T-ARCH-005
pbx-infra    fs / AMI / CDR
apps/web     services → actions → pages / app/actions
```

**依存**: `core ← ops, db, infra ← web`。`db → ops` 禁止。

### コンテキスト型（web）

| 型 | フィールド | 誰が使う |
|----|------------|----------|
| `ActionContext` | `auth`, `sessionToken`, `meta` | ログイン・TOTP・auth-only actions |
| `AppContext` | 上記 + `db`, `infra`, `infraDirs` | **services**・要 DB の action impl |

**actions に `ctx.db` を書かない**（T-ARCH-006）。DB は **services** に閉じる。`accounts.ts` は `ctx.auth` のみ可。

### apps/web 配置（正本パス）

| 関心 | パス | 規律 |
|------|------|------|
| **Use-case** | `server/services/*.ts` | validate → db → infra.sync → `audit`（`server/audit.ts`） |
| Action impl | `server/actions/*.ts` + `impl.ts` | FormData → **service** のみ |
| Form 契約 | `server/actions/forms/*.ts` | field 名の単一正本（T-FORM-001） |
| 認証 UC | `server/services/auth-login.ts` | `authenticateLogin`（IP→PW→TOTP→session） |
| Server Action 登録 | `app/actions/<domain>.ts` | flash + `getRequestContext` |
| Server Action barrel | `app/actions.ts` | **re-export のみ**（T-SOC-004） |
| API handler | `server/api/handlers/*.ts` | 業務ロジック。認可は `withAuth` |
| API barrel | `server/api-handlers.ts` | **re-export のみ**（T-SOC-005） |
| API 認可 | `server/api/with-auth.ts` | `withAuth` / `authErrorResponse` |
| API CSRF 門番 | `server/api/post-origin.ts` | POST route から呼ぶ（T-SEC-CSRF-001） |
| 画面データ | `server/page-data.ts` | repo 経由。SQL 禁止。parity B は `services/*` 委譲（付録 D） |
| parity B UC | `server/services/home-summary.ts`, `concurrency-ui.ts`, `billing-detail.ts`, `cdr-list.ts`, `cdr-sync.ts`, `media-sync.ts` | OpenPBX レガシー画面ギャップ（steps 付録 D） |
| パス | `server/paths.ts` | env は server のみ。**page 禁止** |
| API 文脈 | `server/request-meta.ts` | `buildContextFromRequest(req)` |
| Edge IP | `server/request-ip.ts` | middleware 専用 |
| Middleware | `middleware.ts` + `middleware-ip.ts` | `@openpbx/core/auth/policy` サブパスのみ |
| infra 書込 | `server/infra-sync.ts` | trunk: `renderTrunksPjsipIfValid` |

### services（mutation 一覧）

`extensions`, `ring-groups`, `pickup`, `phonebook`, `business-hours`, `trunks`, `upgrades`, `guidance`, `ivr`, `admin-policy`, `auth-login`

**読取・集計（mutation 以外）**: `home-summary`, `concurrency-ui`, `billing-detail`, `cdr-list`, `cdr-sync`, `media-sync`, `health`, `dashboard`

### API（parity B 追加分）

| Route | Handler | 契約 |
|-------|---------|------|
| `GET/PUT/DELETE` `/api/extensions/[number]` | `handlers/extension-by-number.ts` | T-API-EXT-NUM。PUT/DELETE は `rejectDisallowedPostOrigin` + `PBX_CONFIG_WRITE_MIN_ROLE` |

domain mutation は **T-ARCH-004**（core `validate*`）。`auth-login` / `guidance` delete / `admin-policy` は例外。

### package import（web）

| 層 | `@openpbx/db` バレル | 推奨 subpath 例 |
|----|---------------------|-----------------|
| `server/services`, `page-data`, `auth`, `app-context` | 可 | — |
| `server/actions/**`, `server/api/handlers/**` | **禁止** T-PKG-001 | `@openpbx/db/repos/extensions`, `@openpbx/db/errors` |
| `server/api/handlers/**` infra | **禁止** バレル | `@openpbx/infra/cdr/ingest`, `@openpbx/infra/fs/recording` |

`@openpbx/core` バレルは **middleware 禁止**（T-MW-008）。Edge では `@openpbx/core/auth/policy`。

---

## 4. 規律（エージェント向け）

| 規律 | 意味 |
|------|------|
| Red なし Green 禁止 | `T-XXX-000` を先に Red（§7 正本） |
| 新 mutation | **`server/services/<domain>.ts`** に `*WithSync` / UC 関数 |
| 新 Server Action | `server/actions` 薄く + `app/actions/<domain>.ts` に flash 登録 |
| 新 API | `server/api/handlers/<name>.ts` + `withAuth` + route は `buildContextFromRequest` |
| 新 SQL | `pbx-db/src/repos/*.ts` のみ |
| 新検証 | `pbx-core` → services から呼ぶ |
| 新 audit action | `pbx-core/src/prod/audit-actions.ts` に文字列追加 |
| 新 form | `server/actions/forms/<domain>-form.ts` + Vitest T-FORM |
| it.skip 禁止 | manual-only は進捗表 |

---

## 5. 新機能チェックリスト（§6）

1. [ ] core: `validate*` + テスト（Red→Green）
2. [ ] db: `repos/<domain>.ts`
3. [ ] **`server/services/<domain>.ts`**（validate → db → sync → audit）
4. [ ] **`server/actions/<domain>.ts`**（`parse*Form` があれば `actions/forms/`）
5. [ ] `server/actions/impl.ts` re-export
6. [ ] **`app/actions/<domain>.ts`**（`'use server'` + flash）
7. [ ] API が要るなら **`server/api/handlers/`** + `api-handlers.ts` barrel
8. [ ] 新 Branded 値なら `brands.ts` + `to*Draft` + `brands.test.ts`
9. [ ] `MUTATION_SERVICES` / `ACTIONS_SERVICE_ROUTED` / `BRAND_BOUNDARY_SERVICES` を `denwa-architecture-gate.mjs` に追加
10. [ ] POST API なら `rejectDisallowedPostOrigin`（T-SEC-CSRF-001）
11. [ ] 機微 API なら `pbx-api-policy` の `minRole` + gate `SENSITIVE_API_*`（必要時）
12. [ ] `docs/SECURITY-MAP.md` にゲート ID を 1 行追記（セキュリティ変更時）
13. [ ] parity B 系 core 変更なら `npm run test:coverage:parity-b`（branch 90%）
14. [ ] `npm run harness` 緑

---

## 6. 禁止（門番で落ちる）

- page / `server/actions` から DB・infra 直結（T-ARCH-002/006）
- `services` → `actions` import（T-SOC-003）。audit は `server/audit.ts`
- `app/actions.ts` / `api-handlers.ts` に handler 実装を書く（T-SOC-004/005）
- actions/forms・api/handlers で `@openpbx/db` バレル（T-PKG-001）
- middleware から `@openpbx/core` バレル（T-MW-008）
- `pbx-db` → `pbx-ops`
- `apps/web/src/lib` に domain 二重実装（T-SOC-002）
- ログインで TOTP をスキップする実装（T-ACT-021 / `auth-login` 迂回）
- `export class` / `class extends Error`（T-TS-003）
- カスタム `*Error` への `instanceof`（T-TS-004）— `instanceof Error` / `instanceof File` は可
- `*Draft = {`（Readonly なし T-TS-002）
- 秘密の commit / `--no-verify` 恒常利用
- POST API で CSRF 門番なし（T-SEC-CSRF-001）
- `renderCdrExportCsv` を web/lib で再実装（T-SEC-CSV-001 / T-SOC-002）
- dialplan の `System(..., "${CALLERID(name)}", ...)`（T-SEC-SHELL-001）
- compose に `8088:8088` / `8089:8089` ホスト公開（T-SEC-A05-001）

---

## 7. legacy

- 位置: **`../OpenPBX`**（`docs/LEGACY.md`）
- 読取専用・一括コピー禁止

---

## 8. OpenPBX legacy parity B（レガシー画面ギャップ）

**gap 計画**（`/network`・患者・問診・Chrome）とは別。**既存 PBX 画面**で OpenPBX にあった CDR 検索・課金明細・同時通話グラフ・ホーム X/Y・softphone 2 列・内線 REST など。

| 詳細 | パス |
|------|------|
| 手順・Test ID・層マップ | **`steps-denwa.md` 付録 D** |
| gap 移植進捗（Phase 0〜6） | `docs/OPENPBX-GAP-PROGRESS.md` |
| 差分機能 TDD 計画 | `docs/OPENPBX-GAP-MIGRATION-TDD-PLAN.md` |

**seed 内線**: `1001` / `1002` / `1003`（E2E `登録済み (3)`）。**ポーリング**: CDR 10s・concurrency 30s（`CDR_POLL_INTERVAL_MS` / `CONCURRENCY_POLL_INTERVAL_MS`）。

---

## 9. 関連スキル

| スキル | 用途 |
|--------|------|
| **linegas** | 門番の早い/遅い分離の参考 |
| **line** | 将来 E2E |
| **pentest-tdd-loop**（任意） | 自走ペネトレの参考。denwa 正本は `SECURITY-MAP.md` + 付録 C |

### 指示例（セキュリティ）

- `/denwa 6` + 「T-SEC-CSRF-001 POST に Origin 門番」
- `/denwa 2` + 「T-SEC-AMI-002 context allowlist Red→Green」
- `/denwa 8` + 「T-SEC-A05-001 prod-check 通す」
- 「ペネトレ ITIL 第4章」→ 付録 C Treatment、Ch3 まで Red テストを増やさない
- `/denwa` + 「parity B / レガシー画面ギャップ」→ **付録 D** を Read してから TDD
- `/denwa 2` + 「T-CDR-FILT-001」→ `core/cdr/filter.ts` + `openpbx-parity-b.test.ts`
