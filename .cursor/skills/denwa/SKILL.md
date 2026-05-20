---
name: denwa
description: >-
  OpenPBX TDD 再構築（/denwa）。番号 0→9。Step 開始時に steps-denwa.md §N 必読で docs と ../OpenPBX を Read。
  pre/post(static)・stop/pre-push(harness) 自動。Vitest @openpbx/core、legacy 読取専用。
  Use when: /denwa, denwa, TDD-REBUILD-PLAN, legacy OpenPBX, harness, pbx-core, golden master.
---

# denwa — OpenPBX TDD 再構築（`/denwa`）

## [critical] Step を受けたら最初にやること

ユーザーが **`/denwa`** または **番号 N**（例 `2`）を送ったら:

1. **`.cursor/skills/denwa/steps-denwa.md` の `§N` と `§N 必読` を Read する**（実装・Write の前）
2. 必読リストの **denwa `docs/*` と `../OpenPBX/...` をすべて Read** する（存在確認含む）
3. 読んだパスを 1 行で報告してから TDD / 実装に入る

**毎チャットで OpenPBX 全文を読む必要はない。** ただし **Skill で Step N に入ったそのセッションでは、§N 必読は省略禁止。**

legacy 正本パス: リポ root から **`../OpenPBX`**（`docs/LEGACY.md` 参照）。

---

**正本**: 本 SKILL → **`steps-denwa.md` の §{番号}`**（メニュー番号と 1:1）→ `docs/TDD-REBUILD-PLAN.md`

**番号で進めるだけでよい**: `harness` / `check` を別メニューにしない。**編集すると pre/post が毎回 `check:static`**、**その turn の終わりで stop が `harness`**、**push で再度 `harness`**。手動はテストを早く見たいときの `harness:fast` だけ。

---

## 1. メニュー（この順で進める）

```
denwa (OpenPBX TDD) — 上から順に。門番は各 Step 内で自動。

  0   基盤・フック有効化      npm install / lefthook / Cursor Hooks・Phase・T-XXX 1 件選択
  1   legacy + golden        ../OpenPBX 読取・fixtures/golden（T-GM-*）
  2   ドメイン TDD             @openpbx/core — Red→Green→Refactor
  3   早期 runtime smoke     最小 asterisk/docker（Phase 2.5）
  4   DB 層                  @openpbx/db — T-DB-*
  5   Infra 層               @openpbx/infra — 書込・AMI・CDR ingest
  6   API / Actions          Route Handler + Server Actions 40 本
  7   フロント               FRONTEND-PLAN（UI・wire のみ）
  8   通話・本番化           asterisk 通話 smoke・T-PROD・README
  9   共有・PR 完了          commit / push — 門番の最終確認（§check）

番号を入力してください:
```

### 番号ごとに自動で効く門番

| あなたがやること | 自動（手動不要） |
|------------------|------------------|
| **0** で `npm install` 済み | 以降すべての Step で有効 |
| **2〜8** でファイルを Write/Edit | **preToolUse** → `check:static` → **postToolUse** / **afterFileEdit** → `check:static` |
| **2〜8** のエージェント turn 終了 | **stop** → `npm run harness`（ソースを触ったとき） |
| **9** で `git commit` | **pre-commit** → `check:static` |
| **9** で `git push` | **pre-push** → `npm run harness` |

**手動だけ足す場合**: Step **2〜8** の TDD 中にテストをすぐ見たい → `npm run harness:fast`（stop を待たない）。

### よく使う経路

| 目的 | 番号 |
|------|------|
| 初めて / フックが効かない | **0** |
| 内線ドメインだけ直す | **0 → 2**（turn 末に harness 自動） |
| workspace 追加 | **0 → 4** または該当層 |
| PR を出す | **9**（push で harness 自動） |
| golden だけ | **1** |

---

## 2. `steps-*` 早見表

| 番号 | steps-denwa.md | 計画書 Phase |
|------|----------------|--------------|
| 0 | §0 | Phase 0 |
| 1 | §1 | legacy + §4.4 golden |
| 2 | §2 | Phase 1〜2 |
| 3 | §3 | Phase 2.5 |
| 4 | §4 | Phase 3 |
| 5 | §5 | Phase 4〜5 |
| 6 | §6 | Phase 6〜6.5 |
| 7 | §7 | Phase 7 |
| 8 | §8 | Phase 8〜10 |
| 9 | §9 | 共有・§check |

---

## 3. アーキテクチャ（依存方向）

```text
packages/pbx-core   (@openpbx/core)   pure domain
packages/pbx-db     (@openpbx/db)     SQLite, repositories
packages/pbx-infra  (@openpbx/infra)  fs, AMI, inbox
apps/web            (command-room-web) import のみ
asterisk/ + docker-compose.yml
```

| 規律 | 意味 |
|------|------|
| **Red なし Green 禁止** | §7 の `T-XXX-000` を先に Red |
| **単一正本** | 検証・dialplan・CDR は `@openpbx/core` |
| **Wire 完了** | web が正本 package を import するまで未完了 |
| **it.skip 禁止** | manual-only は進捗表 |

---

## 4. 門番の時系列（1 turn の流れ）

```text
[Step 2〜8 でコード編集]
  preToolUse   → check:static
  （Write/Edit）
  postToolUse  → check:static
  afterFileEdit→ check:static（エディタ保存時）

[その turn 終了]
  stop         → harness（.denwa-dirty あり）

[Step 9]
  git commit   → check:static
  git push     → harness
```

| コマンド | いつ |
|----------|------|
| `check:static` | pre/post/commit（自動） |
| `harness:fast` | 手動・TDD 中のみ |
| `harness` | stop / pre-push（自動） |

---

## 5. フック設定場所

| 層 | ファイル |
|----|----------|
| Cursor | `.cursor/hooks.json` + `.cursor/hooks/denwa-*.sh` |
| Git | `lefthook.yml` |

初回は **Step 0**。Cursor **Settings → Hooks** で有効を確認。

---

## 6. 禁止（要約）

- `apps/web/src/lib/*` に domain 二重実装
- §7 にない ad hoc テスト ID / `it.skip`
- デフォルト秘密のまま本番化
- `--no-verify` の恒常利用

---

## 7. 関連スキル

| スキル | 用途 |
|--------|------|
| **linegas** | 門番の早い/遅い分離の考え方 |
| **line** | 将来 E2E を足すとき |
