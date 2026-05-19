# denwa

OpenPBX を **TDD で再構築**するリポジトリ。仕様の正本は `docs/TDD-REBUILD-PLAN.md`。legacy は隣の [OpenPBX](https://github.com/tanimurahifukka/OpenPBX) を読み取り専用で参照（`docs/LEGACY.md`）。

## クイックスタート

```bash
npm install          # lefthook を prepare で有効化
npm test             # @openpbx/core の Vitest
npm run check:static # 毎編集（Cursor pre/post）・pre-commit
npm run harness:fast # 手動 TDD（static + typecheck + test）
npm run harness      # stop / pre-push（full test:gate）
```

## エージェント向けスキル（`/denwa`）

**番号 0→9 の順**で進める。`harness` は別メニューにせず、編集時 pre/post・turn 末 stop・push で自動。

| 番号 | 内容 |
|------|------|
| 0 | 基盤・フック有効化 |
| 1 | legacy + golden |
| 2〜8 | 各層 TDD / runtime |
| 9 | commit / push（最終門番） |

- **`.cursor/skills/denwa/SKILL.md`** — メニュー正本
- **`docs/TDD-REBUILD-PLAN.md`** — 契約 ID

## フック（番号に沿って自動）

| Step | 自動門番 |
|------|----------|
| 2〜8 編集 | pre/post → `check:static` |
| 2〜8 turn 終了 | stop → `harness` |
| 9 commit | pre-commit → static |
| 9 push | pre-push → `harness` |

Step **0** で `npm install` + Cursor Hooks 有効化。

## レイアウト（目標）

```text
packages/pbx-core   # @openpbx/core（ドメイン・進行中）
packages/pbx-db     # Phase 3 以降
packages/pbx-infra  # Phase 4 以降
apps/web            # Phase 6 以降
```
