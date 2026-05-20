---
name: denwa
description: >-
  OpenPBX TDD 再構築（denwa）。/denwa。番号 0→9。pre/post(harness:fast)・stop/pre-push(harness) 自動。
  層: core(pure) / ops(I/O) / db(repos) / infra / web(services+actions)。契約 docs/TDD-REBUILD-PLAN.md。
  Use when: /denwa, denwa, pbx-core, pbx-ops, use-case services, T-ARCH, T-ACT, harness, prod-check, legacy.
  正本 .cursor/skills/denwa。手順 steps-denwa.md §0〜§9。
---

# denwa — OpenPBX TDD 再構築（`/denwa`）

**正本**: 本 SKILL → **`steps-denwa.md` §{番号}`** → `docs/TDD-REBUILD-PLAN.md`

**番号だけでよい**: `harness` / `check` は別メニューにしない。編集時 **pre→static** / **post→harness:fast**、turn 末 **stop→harness**、push で **harness** 再実行。

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
| Step 2〜8 で Write/Edit | pre → `check:static`（**secrets + architecture gate**）/ post → `harness:fast` |
| turn 終了 | stop → `npm run harness` |
| `git commit` | pre-commit → `harness:fast` |
| `git push` | pre-push → `npm run harness` |
| GitHub Actions | `harness:fast` + `test:gate`（CI と同型） |

**変更容易性・カプセル化・関心の分離**は Skill の「推奨」ではなく **`scripts/denwa-architecture-gate.mjs`**（`check:static` 経由）で強制。編集1ファイル時も pre/post で該当ルールのみ再検査。

手動: TDD 中だけ `npm run harness:fast`。本番化: `npm run prod-check`（§8）。

---

## 2. アーキテクチャ

```text
pbx-core     pure domain + prod/findings（fail/pass 型）  T-ARCH-001
pbx-ops      compose・conf・inbox・prod/check            I/O
pbx-db       schema + repos（ops に依存しない）          T-ARCH-005
pbx-infra    fs 書込・AMI・CDR
apps/web     services（use-case）→ actions（薄い）→ pages
asterisk/ + docker-compose.yml
```

**依存**: `core ← ops, db, infra ← web`。`db → ops` は禁止。

### apps/web の置き場所

| 関心 | パス | 規律 |
|------|------|------|
| **変更ユースケース** | `server/services/*.ts` | core **validate** → db → **infra.sync** → **audit** を1ファイルに閉じる |
| Server Actions | `server/actions/*.ts` + `impl.ts`（barrel） | FormData 解析のみ。DB/sync を直書きしない |
| 画面データ | `server/page-data.ts` | repo 経由。SQL・`export db()` 禁止 |
| パス解決 | `server/paths.ts` | `process.env` は server のみ。**page 禁止** |
| API 文脈 | `server/request-meta.ts` | `buildContextFromRequest(req)` + IP |
| Edge IP | `server/request-ip.ts` | middleware 専用（DB  import なし） |
| Middleware | `middleware-ip.ts` | `@openpbx/core/auth/policy` サブパス（barrel 禁止） |
| 認証 | `server/auth.ts` + `lib/auth.ts` | `getRequestContext()` |
| infra 書込 | `server/infra-sync.ts` | trunk は `renderTrunksPjsipIfValid` |

**services（mutation 正本）**

`extensions`, `ring-groups`, `pickup`, `phonebook`, `business-hours`, `trunks`, `upgrades` — 各ファイルに `validate*` from core 必須（**T-ARCH-004**）。

### 境界（static gate + Vitest 二重）

| ID | 内容 | 強制 |
|----|------|------|
| T-ARCH-001 | core に fs/child_process なし | static + Vitest |
| T-ARCH-002 | `page.tsx` に db / getAppDb なし | static + Vitest |
| T-ARCH-003 | page に process.env / node:path なし。page-data に SQL なし | static + Vitest |
| T-ARCH-004 | services が core の validate を使う | static + Vitest |
| T-ARCH-005 | pbx-db が ops に依存しない | static + Vitest |
| T-ARCH-006 | 移行済み actions が `ctx.db` / `ctx.infra.sync*` 直叩きしない | static + Vitest |
| T-API-IP-001 | API route が `buildContextFromRequest(req)` | static + Vitest |
| T-MW-007/008 | middleware IP + Edge 安全 import | static |
| T-INFRA-TRUNK-001 | infra-sync が `renderTrunksPjsipIfValid` | static + Vitest |
| T-SOC-001/002 | infra.extensions ネスト禁止・web/lib に domain 禁止 | static |

実装: `scripts/denwa-architecture-gate.mjs` ← `check-denwa-static.mjs`。

---

## 3. 規律（エージェント向け）

| 規律 | 意味 |
|------|------|
| Red なし Green 禁止 | §7 の `T-XXX-000` を先に Red |
| 新 mutation | **services に足す**。actions は薄く |
| 新 SQL | `pbx-db/src/repos/*.ts` のみ |
| 新検証 | `pbx-core` に足し services から呼ぶ |
| Wire 完了 | web が正本 package を import |
| it.skip 禁止 | manual-only は進捗表 |

---

## 4. 門番コマンド

| コマンド | いつ |
|----------|------|
| `check:static` | pre / afterFileEdit（architecture gate 含む） |
| `harness:fast` | post / pre-commit / 手動 |
| `harness` | stop / pre-push / CI（fast + test:gate） |
| `prod-check` | §8 手動 |

実装: `scripts/harness-lib.sh`（workspaces 自動列挙）。

---

## 5. 禁止

- `apps/web/src/lib` に domain 二重実装
- page から `getAppDb` / `@openpbx/db` / `process.env` / `node:path`
- actions に validate なしで DB 書込
- `@openpbx/core` バレルを middleware から import（crypto 混入）
- `pbx-db` → `pbx-ops` 依存
- デフォルト秘密の commit / `--no-verify` 恒常利用

---

## 6. 新機能の追加手順（§6 向け）

1. core に `validate*` + 契約テスト（Red→Green）
2. db に repo 関数
3. **`server/services/<domain>.ts`** に `*WithSync`（validate → db → sync → audit）
4. **`server/actions/<domain>.ts`** に `*ActionImpl`（service 呼び出しのみ）
5. `impl.ts` / `index.ts` から re-export
6. turn 末 harness が緑であること

---

## 7. 関連スキル

| スキル | 用途 |
|--------|------|
| **linegas** | 門番の早い/遅い分離 |
| **line** | 将来 E2E |
