---
name: denwa
description: >-
  OpenPBX TDD 再構築（/denwa）。0→9。SOC/カプセル化は denwa-architecture-gate + import-boundaries で強制。
  層: core / ops / db / infra / web(services→actions→pages)。pre static / post harness:fast / push harness。
  Use when: /denwa, denwa, T-ARCH, T-SOC, T-ACT, services, withAuth, architecture gate, harness, legacy OpenPBX.
  正本 .cursor/skills/denwa。手順 steps-denwa.md。
---

# denwa — OpenPBX TDD 再構築（`/denwa`）

**正本**: 本 SKILL → **`steps-denwa.md` §{番号}`** → `docs/TDD-REBUILD-PLAN.md`

**番号だけでよい**。`harness` / `check` は独立メニューにしない。編集時 **pre→static** / **post→harness:fast**、turn 末 **stop→harness**、push で **harness**。

> **SOC・カプセル化・変更容易性は「推奨」ではない。**  
> `scripts/denwa-architecture-gate.mjs`（`npm run check:static`）+ `apps/web/src/__tests__/import-boundaries.test.ts` が **二重**で強制。  
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
| GitHub Actions | `harness:fast` + `test:gate` |

| コマンド | 内容 |
|----------|------|
| `npm run check:static` | `scripts/check-denwa-static.mjs` → secrets + `denwa-architecture-gate.mjs` |
| `npm run harness:fast` | static + 全 workspace typecheck |
| `npm run harness` | fast + `test:gate`（Vitest 全パッケージ） |

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
| T-MW-007 | middleware が `clientIpOptional`（`ipAllowed=true` 固定禁止） | ✓ | ✓ |
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

**ゲートが赤いとき**: まず `npm run check:static` の `[T-xxx]` 行を読む → 該当ファイルを修正 → `npm run harness:fast`。

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
| 画面データ | `server/page-data.ts` | repo 経由。SQL 禁止 |
| パス | `server/paths.ts` | env は server のみ。**page 禁止** |
| API 文脈 | `server/request-meta.ts` | `buildContextFromRequest(req)` |
| Edge IP | `server/request-ip.ts` | middleware 専用 |
| Middleware | `middleware.ts` + `middleware-ip.ts` | `@openpbx/core/auth/policy` サブパスのみ |
| infra 書込 | `server/infra-sync.ts` | trunk: `renderTrunksPjsipIfValid` |

### services（mutation 一覧）

`extensions`, `ring-groups`, `pickup`, `phonebook`, `business-hours`, `trunks`, `upgrades`, `guidance`, `ivr`, `admin-policy`, `auth-login`

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
8. [ ] `MUTATION_SERVICES` / `ACTIONS_SERVICE_ROUTED` を `denwa-architecture-gate.mjs` に追加（新 domain 時）
9. [ ] `npm run harness` 緑

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
- 秘密の commit / `--no-verify` 恒常利用

---

## 7. legacy

- 位置: **`../OpenPBX`**（`docs/LEGACY.md`）
- 読取専用・一括コピー禁止

---

## 8. 関連スキル

| スキル | 用途 |
|--------|------|
| **linegas** | 門番の早い/遅い分離の参考 |
| **line** | 将来 E2E |
