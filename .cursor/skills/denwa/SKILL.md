---
name: denwa
description: >-
  OpenPBX TDD 再構築（denwa）。/denwa。番号 0→9 の順で進めると pre/post(static)・stop/pre-push(harness) が自動。
  Vitest 主戦場 @openpbx/core + @openpbx/ops/db/infra/web、legacy 読取専用、契約 ID は docs/TDD-REBUILD-PLAN.md。
  Use when: /denwa, denwa, OpenPBX rebuild, pbx-core, pbx-ops, TDD-REBUILD-PLAN, npm run harness,
  test:gate, prod-check, legacy, golden master, Phase 0〜10, import boundaries, Cursor hooks.
  正本 .cursor/skills/denwa。手順は steps-denwa.md の §0〜§9（メニュー番号と一致）。
---

# denwa — OpenPBX TDD 再構築（`/denwa`）

**正本**: 本 SKILL → **`steps-denwa.md` の §{番号}`**（メニュー番号と 1:1）→ `docs/TDD-REBUILD-PLAN.md`

**番号で進めるだけでよい**: `harness` / `check` を別メニューにしない。**編集すると pre/post が毎回 `check:static`**、**その turn の終わりで stop が `harness`**、**push で再度 `harness`**。手動はテストを早く見たいときの `harness:fast` だけ。

---

## 1. メニュー（この順で進める）

```
denwa (OpenPBX TDD) — 上から順に。門番は各 Step 内で自動。

  0   基盤・フック有効化      npm install / lefthook / Cursor Hooks・Phase・T-XXX 1 件選択
  1   legacy + golden        ../OpenPBX 読取・fixtures/golden（T-GM-*）
  2   ドメイン TDD             @openpbx/core — Red→Green（pure のみ）
  3   早期 runtime smoke     最小 asterisk/docker（Phase 2.5）
  4   DB 層                  @openpbx/db — T-DB-*・repos
  5   Infra 層               @openpbx/infra — 書込・AMI・CDR ingest
  6   API / Actions          Route Handler + Server Actions 40 本
  7   フロント               FRONTEND-PLAN（UI・wire のみ）
  8   通話・本番化           @openpbx/ops smoke・T-PROD・prod-check・README
  9   共有・PR 完了          commit / push — 門番の最終確認（§check）

番号を入力してください:
```

### 番号ごとに自動で効く門番

| あなたがやること | 自動（手動不要） |
|------------------|------------------|
| **0** で `npm install` 済み | 以降すべての Step で有効 |
| **2〜8** でファイルを Write/Edit | **preToolUse** → `check:static` → **postToolUse** → `harness:fast` / **afterFileEdit** → `check:static` |
| **2〜8** のエージェント turn 終了 | **stop** → `npm run harness`（ソースを触ったとき） |
| **9** で `git commit` | **pre-commit** → `harness:fast` |
| **9** で `git push` | **pre-push** → `npm run harness` |

**手動だけ足す場合**: Step **2〜8** の TDD 中にテストをすぐ見たい → `npm run harness:fast`（stop を待たない）。本番化チェックだけ → `npm run prod-check`（§8）。

### よく使う経路

| 目的 | 番号 |
|------|------|
| 初めて / フックが効かない | **0** |
| 内線ドメインだけ直す | **0 → 2**（turn 末に harness 自動） |
| workspace 追加 | **0 → 4** または該当層 |
| I/O・compose・prod チェック | **8**（`@openpbx/ops`） |
| PR を出す | **9**（push で harness 自動） |
| golden だけ | **1** |
| 層違反の直し方を確認 | SKILL §3 + `T-ARCH-001` / `T-ARCH-002` |

---

## 2. `steps-*` 早見表

| 番号 | steps-denwa.md | 計画書 Phase | 主なパッケージ |
|------|----------------|--------------|----------------|
| 0 | §0 | Phase 0 | root scripts |
| 1 | §1 | legacy + §4.4 golden | fixtures |
| 2 | §2 | Phase 1〜2 | `pbx-core` |
| 3 | §3 | Phase 2.5 | asterisk / compose |
| 4 | §4 | Phase 3 | `pbx-db` |
| 5 | §5 | Phase 4〜5 | `pbx-infra` |
| 6 | §6 | Phase 6〜6.5 | `apps/web` server |
| 7 | §7 | Phase 7 | `apps/web` UI |
| 8 | §8 | Phase 8〜10 | `pbx-ops` + README |
| 9 | §9 | 共有・§check | git |

---

## 3. アーキテクチャ（依存方向と責務）

```text
packages/pbx-core   (@openpbx/core)   pure domain — fs/network/SQLite 禁止 (T-ARCH-001)
packages/pbx-ops    (@openpbx/ops)    compose・conf 検査・inbox runner・prod/check
packages/pbx-db     (@openpbx/db)     SQLite, schema, repositories
packages/pbx-infra  (@openpbx/infra)  dialplan 書込, AMI, CDR ingest
apps/web            (command-room-web)  orchestration のみ — page は getAppDb 直叩き禁止 (T-ARCH-002)
asterisk/ + docker-compose.yml
```

**許可される import（要約）**

| 層 | よい | ダメ |
|----|------|------|
| **core** | 純関数・型・`audit-actions` 定数 | `node:fs`, `better-sqlite3`, compose 読込 |
| **ops** | core + fs/subprocess/compose パス | UI・Server Actions |
| **db** | core + SQL/repos | Next.js |
| **infra** | core + db（必要時）+ fs/AMI | UI |
| **web** | core, db, infra, ops | `apps/web/src/lib` に domain 二重実装 |

**apps/web の置き場所（再構築後の慣例）**

| 関心 | パス |
|------|------|
| Server Actions 実装 | `apps/web/src/server/actions/impl.ts`（共有は `actions/shared.ts`） |
| 画面用データ取得 | `apps/web/src/server/page-data.ts` → `pbx-db` の repos を呼ぶ |
| 認証オーケストレーション | `apps/web/src/server/auth.ts` → `repos/accounts.ts`, `repos/policy.ts` |
| Middleware IP | `apps/web/src/server/middleware-ip.ts`（Edge: `IP_ALLOW_CIDRS`、DB 側は login 時も検証） |
| リクエスト文脈 | `getRequestContext()` — **page.tsx で `getAppDb()` を直接使わない** |

| 規律 | 意味 |
|------|------|
| **Red なし Green 禁止** | §7 の `T-XXX-000` を先に Red |
| **単一正本** | 検証・dialplan・CDR 変換は `@openpbx/core` |
| **I/O は ops / infra** | compose・conf 検査・prod 既定値チェックは `@openpbx/ops` |
| **SQL は db** | 新規クエリは `packages/pbx-db/src/repos/*.ts` に足す |
| **Wire 完了** | web が正本 package を import するまで未完了 |
| **it.skip 禁止** | manual-only は進捗表 |
| **境界テスト** | `T-ARCH-001`（core）、`T-ARCH-002`（app pages）を壊さない |

**legacy との差（読むときの期待）**

- OpenPBX: `apps/web/src/lib/*.ts` に domain + DB が同居
- denwa: 上記レイヤ分割 + `test:gate` + static/harness 門番

---

## 4. 門番の時系列（1 turn の流れ）

```text
[Step 2〜8 でコード編集]
  preToolUse   → check:static
  （Write/Edit）
  postToolUse  → harness:fast（static + 全 workspace typecheck）
  afterFileEdit→ check:static（エディタ保存時）

[その turn 終了]
  stop         → harness（.denwa-dirty あり）

[Step 9]
  git commit   → check:static
  git push     → harness
```

| コマンド | いつ | 内容 |
|----------|------|------|
| `check:static` | pre / afterFileEdit（自動） | it.skip 禁止、web/lib domain 禁止、staged secret |
| `harness:fast` | postToolUse / pre-commit / CI job（自動） | static + **全 workspace** typecheck |
| `harness` | stop / pre-push / CI job（自動） | harness:fast + **test:gate**（Vitest 全 workspace） |
| `prod-check` | §8・手動 | 本番化前の既定秘密・パスチェック（dev 既定では FAIL 想定） |

---

## 5. フック設定場所

| 層 | ファイル |
|----|----------|
| Cursor | `.cursor/hooks.json` + `.cursor/hooks/denwa-*.sh` |
| Git | `lefthook.yml` |

初回は **Step 0**。Cursor **Settings → Hooks** で有効を確認。

---

## 6. 禁止（要約）

- `apps/web/src/lib/*` に domain 二重実装（`validate*` / `render*` / `parse*` / `compute*`）
- `apps/web` の **page / layout** から `getAppDb`・`better-sqlite3` 直 import
- `@openpbx/core` に fs・network・SQLite
- §7 にない ad hoc テスト ID / `it.skip`
- デフォルト秘密のまま本番化（`prod-check` で検知）
- `--no-verify` の恒常利用

---

## 7. 関連スキル

| スキル | 用途 |
|--------|------|
| **linegas** | 門番の早い/遅い分離の考え方 |
| **line** | 将来 E2E を足すとき |
