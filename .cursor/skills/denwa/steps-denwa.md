# denwa — 手順詳細（steps-denwa）

**メニュー番号 = 本ファイルの §番号**（SKILL.md と 1:1）。**`harness` / `check` は独立 Step ではなく §9 と各 Step 内の自動門番**。

---

## §運用 番号順と門番（読み方）

```text
Step 0  … フックを有効にする（一度だけ）
Step 1  … legacy / golden（読む・fixture。編集少 → pre/post ほぼ無し）
Step 2〜8 … 実装（編集するたび pre/post → turn 末 stop）
Step 9  … commit / push（pre-commit harness:fast → pre-push harness）
```

**エージェント**: ユーザーが番号 **N** を選んだら **§N だけ Read** して従う。別途 `harness` メニューを勧めない（§9 か turn 末で足りる）。

**完了定義**: 0→9 を各1回やっただけでは計画完了にならない。各 Step で `docs/TDD-REBUILD-PLAN.md` §7 の `T-XXX-000` を **Red→Green し尽くす**（§1.4）。

---

## §0 基盤・フック有効化（Phase 0）

**目的**: 門番が動く状態 + 今回の `T-XXX-000` を 1 つ決める。

### 手順

1. `docs/TDD-REBUILD-PLAN.md` §1 スコープを読む
2. 未 Green の契約 ID を **1 つ**選ぶ（§7）
3. リポ root で:

```bash
npm install          # lefthook install（prepare）
```

4. **Cursor → Settings → Hooks** で `.cursor/hooks.json` が有効
5. 動作確認（任意）:

```bash
npm run check:static
npm run harness
```

### workspaces（現状）

`packages/pbx-core`, `pbx-ops`, `pbx-db`, `pbx-infra`, `apps/web`

### この Step で効く門番

| 操作 | 門番 |
|------|------|
| `package.json` 等を編集 | pre/post → static（**`denwa-architecture-gate.mjs`**: T-ARCH/SOC） |
| turn 終了 | stop → harness（編集した場合） |

### 出口

- [ ] `npm run harness` が緑
- [ ] 対象 `T-XXX-000` を決めた
- [ ] **次は §1 または §2**（legacy 未 clone なら §1 先）

---

## §1 legacy + golden

**目的**: OpenPBX を仕様書として読み、golden を置く（§4.4）。

```bash
git clone https://github.com/tanimurahifukka/OpenPBX.git ../OpenPBX
```

| 用途 | OpenPBX 側（`docs/LEGACY.md`） | denwa 側の写し先 |
|------|-------------------------------|------------------|
| DB | `apps/web/src/lib/db.ts` | `packages/pbx-db` |
| ドメイン | `apps/web/src/lib/*.ts` | `packages/pbx-core` |
| Actions | `apps/web/src/app/actions.ts` | `app/actions/<domain>.ts` + `server/actions/` |
| compose / conf 検査 | （散在） | `packages/pbx-ops` |

`fixtures/golden/current/` に `T-GM-001`〜`009` を順に追加。

### 門番

- 主に**読むだけ** → pre/post は fixture 編集時のみ
- golden 追加後の turn 末 → **stop → harness**

### 出口

- [ ] legacy パスが読める
- [ ] 対象 golden が 1 本以上ある（または次 PR で追加と明記）

**次: §2**（domain）

---

## §2 ドメイン TDD（@openpbx/core · Phase 1〜2）

**目的**: `packages/pbx-core` で Red→Green→Refactor。**pure のみ**（I/O は §8 の ops へ）。

### 手順（1 契約ずつ）

1. §7 から `T-XXX-000` を 1 つ（Step 0 で選んだもの）
2. legacy の該当 `lib/*.ts` を読む（**コピペ一括移植しない**）
3. `packages/pbx-core/src/__tests__/` に **Red**（`T-EXT-001: Given … When … Then …`）
4. 最小 **Green** → **Refactor**
5. **turn を終える**（→ **stop が harness を自動実行**）
6. テストだけ早く見るなら `npm run harness:fast`（任意）

### 層規律

- `node:fs` / `node:child_process` / `better-sqlite3` 等を core に入れない → **`T-ARCH-001`** が Red になる
- prod 用の監査アクション定数など **値オブジェクト** は core 可（`audit-actions`）

### TypeScript 規約（§5.4.1 / t-wada）— **門番で強制**

| 規約 | 門番 | 実装 |
|------|------|------|
| クラス禁止 | **T-TS-003** static + Vitest | tag + factory |
| instanceof カスタム Error 禁止 | **T-TS-004** static + Vitest | `isXxxError(e)` |
| Readonly Draft | **T-TS-002** static + Vitest | `Readonly<{…}>` |
| Branded Type | **T-TS-001** static + Vitest | `brands.ts` |
| services で brand 化 | **T-TS-005** static | `to*Draft` after `validate*` |

構造的部分型: 型注釈は実行時に消える。`private` も実行時に無視される。

例（内線）: `ExtensionDraftInput`（string）→ `validateExtensionDraft` → `toExtensionDraft`（`ExtensionNumber`）。

ゲート赤 → `steps-denwa.md` 付録 B の T-TS 行を参照。**gate と Vitest を同時に更新**してからルール緩和。

### 門番（§2 の作業中は常に）

| タイミング | 自動 |
|------------|------|
| 毎 Write/Edit | pre → static / post → `harness:fast` |
| エージェント turn 終了 | stop → `harness`（full） |
| 手動（任意） | `harness:fast` |

### 出口

- [ ] 対象 ID が Green
- [ ] stop の harness が緑（または直前に `npm run harness` 手動で確認）
- [ ] `roadmap.test.ts` の該当 todo を ID 付き `it` に降ろす（該当時）

**次: §3**（早期 smoke）または並行で §4 準備

---

## §3 早期 runtime smoke（Phase 2.5）

**目的**: UI/DB 前に Asterisk が最小 conf を読める。

- `T-GM-001`, `T-GM-009`, `T-DOCKER-001`〜`003`, `T-AST-CONFIG-001`
- `docker compose config`、最小 `asterisk/` 雛形
- conf 検査ロジックは **`packages/pbx-ops`**（`asterisk/config-check.ts`, `conf-inspect.ts`）

### 門番

§2 と同じ（**編集 → pre/post → stop harness**）。

### 出口

- [ ] config smoke 緑
- [ ] stop harness 緑

**次: §4**

---

## §4 DB 層（@openpbx/db · Phase 3）

**目的**: `applySchema`, migrations, **repositories**（`T-DB-*`）。

### 慣例

| 種類 | パス例 |
|------|--------|
| スキーマ | `apply-schema.ts`, migrations |
| 一覧・CRUD | `packages/pbx-db/src/repos/*.ts`（`lists.ts`, `accounts.ts`, `policy.ts` 等） |
| infra 用読取 | `infra-load.ts` |
| 本番チェック用 | `prod-check.ts`（`fail`/`pass` 型は `@openpbx/core` の `prod/findings`） |

1. workspace / `test:gate` に `@openpbx/db` が含まれること（§0 時点で済ならスキップ）
2. Red→Green→Refactor（in-memory SQLite fixture）
3. **新規 SQL は page-data に直書きせず repo に足す**（残存 SQL は段階的に repo へ）

### 門番

- pre/post: static（新 package の test も対象）
- stop: **harness**（core + ops + db + … の test:gate）

### 出口

- [ ] `T-DB-*` 対象が Green
- [ ] harness 緑

**次: §5**

---

## §5 Infra 層（@openpbx/infra · Phase 4〜5）

**目的**: ファイル書込、reload、AMI、CDR ingest（`T-INFRA-*`, `T-AMI-*`, `T-CDR-ING-*`）。

- dialplan 生成の**中身**は core、**書込・reload** は infra
- DB からの設定読取は `pbx-db` の `infra-load` 等を経由

### 門番

§4 と同じ。

**次: §6**

---

## §6 API / Actions（apps/web · Phase 6〜6.5）

**目的**: Route Handler、middleware、Server Actions（`T-MW-*`, `T-API-*`, `T-ACT-*`）。  
**SOC は Skill の強制マトリクス + `scripts/denwa-architecture-gate.mjs` で落とす。**

### 4 層（変更時はこの順）

```text
server/services/        use-case 正本（AppContext: db + infra）
server/actions/         *ActionImpl（FormData → service。ctx.db 禁止 T-ARCH-006）
server/actions/forms/   field 名単一正本（T-FORM-001）
app/actions/<domain>.ts Server Action 登録 + flash（barrel: app/actions.ts T-SOC-004）
app/api/**/route.ts     buildContextFromRequest(req)（T-API-IP-001）
server/api/handlers/    JSON 業務（withAuth T-API-AUTH-001、barrel: api-handlers.ts T-SOC-005）
```

| 関心 | パス |
|------|------|
| Use-case | `server/services/*.ts`（`auth-login`, `ivr`, `guidance`, …） |
| audit | `server/audit.ts`（**services が actions を import しない** T-SOC-003） |
| Action impl | `server/actions/*.ts` + `impl.ts` |
| Form 契約 | `server/actions/forms/*.ts` |
| Server Action UI | `app/actions/<domain>.ts` + `app/actions/_flash.ts` |
| API 認可 | `server/api/with-auth.ts` |
| API CSRF | `server/api/post-origin.ts` → `rejectDisallowedPostOrigin`（T-SEC-CSRF-001） |
| API 実装 | `server/api/handlers/*.ts` |
| 読取 | `server/page-data.ts` |
| 認証 UC | `server/services/auth-login.ts` → `authenticateLogin`（T-ACT-021） |
| ロール契約 | `@openpbx/core/auth/pbx-api-policy.ts`（`RECORDING_READ_MIN_ROLE` 等） |
| CDR export | `services/cdr-export.ts` → `handlers/cdr.ts`（T-SEC-CSV-001） |

### コンテキスト

- `ActionContext`: login / TOTP 等（db なし）
- `AppContext`: services 用（`ActionContext` + db + infra）

### 規律（門番で強制）

| やること | 契約 ID |
|----------|---------|
| mutation は services のみ | T-ARCH-006 |
| domain service は core `validate*` | T-ARCH-004 |
| ログインは `authenticateLogin`（TOTP 含む） | T-ACT-021 |
| API route は `buildContextFromRequest(req)` | T-API-IP-001 |
| API handler は `withAuth` | T-API-AUTH-001（Vitest） |
| `app/actions.ts` / `api-handlers.ts` は barrel のみ | T-SOC-004/005 |
| actions/forms・api/handlers は db/infra **subpath** のみ | T-PKG-001 |
| page は page-data のみ | T-ARCH-002/003 |

FormData key を変えるときは **forms/ と page の input を同時**（T-FORM-001）。

### セキュリティ（T-SEC）

地図: **`docs/SECURITY-MAP.md`**。ペネトレ指示時は **付録 C**。

| やること | 契約 ID | 正本 |
|----------|---------|------|
| POST API に Origin 門番 | T-SEC-CSRF-001 | `core/http/csrf.ts` + `post-origin.ts` |
| Origin 無し POST は Fetch Metadata | T-SEC-CSRF-002 | `csrf.ts`（Vitest: `sec-csrf.test.ts`） |
| CDR CSV は core のみ | T-SEC-CSV-001 | `core/cdr/export.ts` |
| ロール変更で他セッション破棄 | T-SEC-SESSION-001 | `destroySessionsForAccount` + `updateAccountRoleWithSession` |
| originate AMI フィールド | T-SEC-AMI-001/002 | `core/originate/ami.ts` |
| 録音 / devices は minRole + withAuth | T-SEC-A01-002/003 | `pbx-api-policy` + handler |
| PBX 書込 API の minRole | T-SEC-A01-001 | gate `checkApiPbxWriteRole` |
| 機微 GET の audit | T-SEC-A09-001 | `audit-actions.ts` |
| guidances 検証 | T-SEC-A03-001 | core `guidance/*` |
| inbox meta | T-SEC-INBOX-001 | core `inbox/validate-meta.ts`（infra は委譲） |

新 POST route: `buildContextFromRequest` のあと **`rejectDisallowedPostOrigin(req)`** を最初に呼ぶ。  
新機微 GET: **`withAuth`** + policy の定数。ゲートに `checkPostApiCsrf` / `checkSensitiveApiMinRole` 等が既にあるか確認。

### Middleware / IP

- Edge: `IP_ALLOW_CIDRS` + `clientIpOptional`（T-MW-007）
- `@openpbx/core/auth/policy` サブパスのみ（T-MW-008）

### 新規ドメイン（TDD）

1. Red: core / `import-boundaries` / 必要なら `extension-form` 型の契約テスト
2. Green: repo → **service** → thin action → `app/actions/<domain>.ts`
3. API が要れば `api/handlers/<name>.ts` + route（POST なら CSRF 門番）
4. **`denwa-architecture-gate.mjs`** の `MUTATION_SERVICES` と `ACTIONS_SERVICE_ROUTED` にファイル名追加
5. セキュリティ変更なら **`docs/SECURITY-MAP.md`** にゲート ID を 1 行追記
6. `npm run harness` 緑

### 門番

§4 と同じ（pre static = architecture gate 含む）。

**次: §7**

---

## §7 フロント（Phase 7）

**目的**: `docs/FRONTEND-PLAN.md` に沿った画面。TDD 強制なし。Action 名・FormData key は変えない。

- 例: IVR 画面は `digit` / `action` / `target` 等、契約どおりの field 名
- データは `page-data` のみ（例: `countInboxSummary`, `listRecordingsForUi`）。`process.env` は `paths.ts` 側

### 門番

- UI 編集: pre/post（主に static・secret）
- 結合確認: turn 末 **harness** + 必要なら Playwright（計画 `T-UI-*`）

**次: §8**

---

## §8 通話・本番化（Phase 8〜10）

**目的**: `docker compose up`、9001/9002 inbox、`T-PROD-*`、README 同期。本番 SIP 非公開は **`docker-compose.prod.yml`** overlay。

### 本番 compose / Asterisk HTTP（T-SEC-A05-001）

| 環境 | compose | SIP / HTTP |
|------|---------|------------|
| 開発 | `docker-compose.yml` | `:5060` 公開は意図的（F-001 台帳参照） |
| 本番 | `docker compose -f docker-compose.yml -f docker-compose.prod.yml` | SIP ホスト非公開、8088/8089 ホストマップなし |

`prod/check.ts`（T-SEC-A05-001）: 開発 tree の `docker-compose.yml` に `8088:8088` / `8089:8089` があれば FAIL。  
dialplan / notify: **T-SEC-SHELL-001** — `CALLERID(name)` を `System()` に渡さない。`notify-event.sh` はメタ文字拒否。

### @openpbx/ops（I/O 正本）

| モジュール | 役割 |
|------------|------|
| `asterisk/config-check.ts`, `conf-inspect.ts` | conf 検査 |
| `docker/compose-file.ts`, `compose-env.ts` | compose 解決 |
| `inbox/notify-runner.ts` | inbox 通知 runner |
| `prod/check.ts` | 本番化チェック本体 |
| `__tests__/phase8-runtime.test.ts` | Phase 8 ランタイム契約 |

```bash
npm run prod-check          # 開発 tree の既定値では FAIL が正常
npx tsx scripts/prod-check.ts
```

### 手動 smoke（README 参照）

```bash
npx tsx scripts/bootstrap-dev-admin.ts
cd apps/web && DATABASE_PATH=../../data/db/command-room.sqlite npm run dev
docker compose up            # 9001/9002 inbox 等
```

### README / 秘密

- README に **既定パスワード文字列を直書きしない**（pre-commit static が拒否）
- 監査ログ: `packages/pbx-core` の `audit-actions` と計画 §2.5 を揃える（例: `login.failed`）

### 門番

- conf/compose 編集: pre/post → static
- turn 末: harness
- 手動 smoke: README 手順（`manual-only` 可）

**次: §9**

---

## §9 共有・PR 完了（旧 check / harness メニュー）

**目的**: リモートに出す前の最終確認。**ここで初めて git 門番がフックと重なる。**

### 手順

1. stop で既に harness が緑ならそのまま；未確認なら `npm run harness`
2. 本番化 PR なら `npm run prod-check` の結果と対応（秘密ローテーション済みか）
3. `git add` … `git commit` → **pre-commit: harness:fast**（自動）
4. `git push` → **pre-push: harness**（自動）

### §check リスト

- [ ] `npm run harness` 緑（push でも再実行される）
- [ ] 触った §7 ID が Green または manual-only 記録
- [ ] `TDD-REBUILD-PLAN.md` と実装のズレなし
- [ ] `npm run check:static` 緑（T-ARCH / T-SOC / T-PKG 含む）
- [ ] `import-boundaries.test.ts` 緑（Vitest 二重門番）
- [ ] secret / SQLite / 録音を commit していない
- [ ] FRONTEND 変更時、FormData key は `actions/forms/*` と page で一致
- [ ] 新規 mutation は `server/services/*`（`app/actions.ts` に実装を書いていない）
- [ ] 新 domain なら `denwa-architecture-gate.mjs` のリスト更新済み
- [ ] 新 POST API に CSRF 門番（T-SEC-CSRF-001）
- [ ] セキュリティ変更なら `docs/SECURITY-MAP.md` 同期
- [ ] 新規 SQL は `pbx-db/src/repos` のみ

### PR テンプレ

```md
## 変更内容
- …

## TDD
- Red: T-XXX-000 …
- Green: …

## 確認（自動門番含む）
- [ ] Cursor stop / pre-push / **GitHub CI** で `npm run harness` 緑（pre-push と同一）
- [ ] check:static（architecture gate）通過
- [ ] pre-commit harness:fast 通過
- [ ] prod-check（本番化時）
```

`--no-verify` は緊急時のみ・PR に理由を書く。

---

## 付録 A: スクリプトとフック一覧

| スクリプト | 内容 |
|------------|------|
| `scripts/harness-lib.sh` | static / typecheck / test:gate の共通実装 |
| `scripts/check-denwa-static.mjs` | pre / afterFileEdit（secrets + T-ARCH/SOC/**T-TS**） |
| `scripts/denwa-architecture-gate.mjs` | SOC + **T-TS-001〜005** 静的強制 |
| `scripts/harness-fast.sh` | postToolUse / pre-commit / 手動 |
| `scripts/harness-check.sh` | stop / pre-push / **CI**（`npm run harness` = prod-check + SCA 含む） |
| `scripts/prod-check.ts` | `pbx-ops` の prod/check を CLI 実行 |

| Cursor フック | イベント |
|---------------|----------|
| `denwa-pre-tool.sh` | preToolUse |
| `denwa-post-tool.sh` | postToolUse |
| `denwa-after-file-edit.sh` | afterFileEdit / afterTabFileEdit |
| `denwa-stop-harness.sh` | stop |
| `denwa-block-secrets-commit.sh` | beforeShellExecution (git commit) |

| Git | イベント |
|-----|----------|
| `lefthook.yml` | pre-commit harness:fast / pre-push harness |

---

## 付録 B: 層違反を直すとき（クイック）

| 症状 | 直し方 |
|------|--------|
| `T-ARCH-001` Red | core から fs/SQLite を ops / db へ |
| `T-ARCH-002` Red | page の db 直 import → `page-data` |
| `T-ARCH-003` Red | page の `process.env` → `page-data` + `paths.ts` |
| `T-ARCH-004` Red | actions の DB 直書き → `services/*` に validate+sync+audit |
| `T-ARCH-005` Red | `ProdCheckFinding` を core に。db から ops 依存を外す |
| `T-API-IP-001` Red | API route に `buildContextFromRequest(req)` |
| `T-INFRA-TRUNK-001` Red | `renderTrunksPjsipIfValid` を使う |
| static: domain in web/lib | ロジックを core へ |
| Edge `node:crypto` エラー | middleware は `@openpbx/core/auth/policy` サブパス |
| staged secret | ローテーション or `prod/check.ts` は分割文字列定義 |
| Action テスト Red | FormData key・service 経由か確認 |
| `T-TS-003` Red | class → `xxxError()` + `isXxxError` |
| `T-TS-004` Red | `instanceof DuplicateError` → `isDuplicateError(e)` |
| `T-TS-002` Red | `*Draft = {` → `Readonly<{…}>` |
| `T-TS-001` Red | Draft.number を Branded + `to*Draft` |
| `T-TS-005` Red | service に `toExtensionDraft` / `toIvrMenuDraft` を追加 |
| `T-SEC-CSRF-001` Red | POST `route.ts` に `rejectDisallowedPostOrigin` |
| `T-SEC-CSRF-002` Red | `csrf.ts` の Fetch Metadata 分岐 + `sec-csrf.test.ts` |
| `T-SEC-CSV-001` Red | CSV を `core/cdr/export.ts` に移し web は service 経由のみ |
| `T-SEC-SESSION-001` Red | `destroySessionsForAccount` + role 更新 service |
| `T-SEC-AMI-001/002` Red | `originate/ami.ts` + handler |
| `T-SEC-A01-002/003` Red | handler に `withAuth` + `pbx-api-policy` 定数 |
| `T-SEC-A05-001` Red | compose から 8088/8089 削除 + `pentest-compose` / prod-check |
| `T-SEC-SHELL-001` Red | dialplan `SAFE_CALLER_NAME` + `shell/argv.ts` + notify-event |
| `T-SEC-TOTP-001` Red | `verifyTotpConsuming` + `totp_last_counter` migrate |
| `T-SEC-INBOX-001` Red | `inbox/validate-meta.ts`（core） |
| gate: `checkPostApiCsrf` 等 Red | `denwa-architecture-gate.mjs` と実装を同時更新（緩めない） |

---

## 付録 C: ペネトレ（ITIL / OWASP）

**キーワード**: ペネトレ、OWASP、ITIL、STRIDE、脅威台帳、F-00x。

**正本**: `docs/SECURITY-MAP.md`（ゲート ID ↔ 緩和 ↔ 残リスク）。

| 章 | エージェントがやること | やらないこと |
|----|------------------------|--------------|
| 1 Identification | 攻撃面を台帳化（docs 可） | コード修正 |
| 2 Threat Modeling | STRIDE × L×I、F-xxx 整理 | コード修正 |
| 3 Verification | 再現手順・期待結果の記録 | **新規 Red テストは書かない**（`pentest-ch3-verification.test.ts` は緩和の静的確認のみ） |
| 4 Treatment | core Red→Green → web/asterisk 配線 → gate | ゲートだけ緩める |
| 5 CSI | `npm run harness` + `docs/SECURITY-MAP.md` + `docs/runbook-security.md` + `docs/PENTEST-NEXT-SCOPE.md` + gate 件数回帰（`pentest-ch5-csi.test.ts`） | 巨大 1 PR にまとめない（§9 で論理分割） |

**TDD 順（Treatment）**: `packages/pbx-core` の契約テスト → `pbx-db` / `pbx-infra` → `server/services` → `api/handlers` → `denwa-architecture-gate.mjs` → `apps/web/src/server/__tests__/pentest-ch*.test.ts`（ch1/ch3 はアクセス・compose の回帰）。

**意図的残存**（台帳に書く）: 開発 compose の SIP `:5060` 公開（本番 overlay で除去）、WSS 自己署名 cert（F-010）、A09 SIEM は次回 PT（`PENTEST-NEXT-SCOPE.md`）。
