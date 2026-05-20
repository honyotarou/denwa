---
name: denwa
description: >-
  OpenPBX TDD 再構築（/denwa）。番号 0→9。各 Step 開始時に steps-denwa.md §N の必読リストで
  docs と ../OpenPBX を Read してから実装。hooks は pre/post static・stop/pre-push harness。
  Use when: /denwa, denwa, TDD-REBUILD-PLAN, legacy OpenPBX, harness.
---

# denwa — OpenPBX TDD 再構築

## [critical] Step を受けたら最初にやること

ユーザーが **`/denwa`** または **番号 N**（例 `2`）を送ったら:

1. **`.cursor/skills/denwa/steps-denwa.md` の `§N` と `§N 必読` を Read する**（実装・Write の前）
2. 必読リストの **denwa `docs/*` と `../OpenPBX/...` をすべて Read** する（存在確認含む）
3. 読んだパスを 1 行で報告してから TDD / 実装に入る

**毎チャットで OpenPBX 全文を読む必要はない。** ただし **Skill で Step N に入ったそのセッションでは、§N 必読は省略禁止。**

legacy 正本パス: リポ root から **`../OpenPBX`**（`docs/LEGACY.md` 参照）。

---

## メニュー 0→9

```
  0   基盤・フック
  1   legacy + golden
  2   ドメイン @openpbx/core
  3   早期 asterisk/docker smoke
  4   DB @openpbx/db
  5   Infra @openpbx/infra
  6   API / Actions
  7   フロント
  8   通話・本番化
  9   commit / push
```

| # | steps-denwa.md | 計画 Phase |
|---|----------------|------------|
| 0 | §0 | 0 |
| 1 | §1 | golden |
| 2 | §2 | 1〜2 |
| 3 | §3 | 2.5 |
| 4 | §4 | 3 |
| 5 | §5 | 4〜5 |
| 6 | §6 | 6〜6.5 |
| 7 | §7 | 7 |
| 8 | §8 | 8〜10 |
| 9 | §9 | 共有 |

---

## 門番（自動）

| タイミング | 内容 |
|------------|------|
| 編集 pre/post | `check:static` |
| turn 終了 | `harness`（ソース変更時） |
| commit | static |
| push | harness |

---

## 正本

| 文書 | 役割 |
|------|------|
| `docs/TDD-REBUILD-PLAN.md` | 契約 ID・Phase・完了 §1.4 |
| `docs/LEGACY.md` | legacy 索引 |
| `docs/FRONTEND-PLAN.md` | UI（Step 7） |
| `../OpenPBX` | 読取専用実装仕様 |

詳細: [steps-denwa.md](steps-denwa.md)
