# denwa — 手順詳細（steps-denwa）

**メニュー番号 = 本ファイルの §番号**（SKILL.md と 1:1）。**`harness` / `check` は独立 Step ではなく §9 と各 Step 内の自動門番**。

---

## §運用 番号順と門番（読み方）

```text
Step 0  … フックを有効にする（一度だけ）
Step 1  … legacy / golden（読む・fixture。編集少 → pre/post ほぼ無し）
Step 2〜8 … 実装（編集するたび pre/post → turn 末 stop）
Step 9  … commit / push（pre-commit static → pre-push harness）
```

**エージェント**: ユーザーが番号 **N** を選んだら **§N だけ Read** して従う。別途 `harness` メニューを勧めない（§9 か turn 末で足りる）。

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

### この Step で効く門番

| 操作 | 門番 |
|------|------|
| `package.json` 等を編集 | pre/post → static |
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

| 用途 | OpenPBX 側（`docs/LEGACY.md`） |
|------|-------------------------------|
| DB | `apps/web/src/lib/db.ts` |
| ドメイン | `apps/web/src/lib/*.ts` |
| Actions | `apps/web/src/app/actions.ts` |

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

**目的**: `packages/pbx-core` で Red→Green→Refactor。

### 手順（1 契約ずつ）

1. §7 から `T-XXX-000` を 1 つ（Step 0 で選んだもの）
2. legacy の該当 `lib/*.ts` を読む
3. `packages/pbx-core/src/__tests__/` に **Red**（`T-EXT-001: Given … When … Then …`）
4. 最小 **Green** → **Refactor**
5. **turn を終える**（→ **stop が harness を自動実行**）
6. テストだけ早く見るなら `npm run harness:fast`（任意）

### 門番（§2 の作業中は常に）

| タイミング | 自動 |
|------------|------|
| 毎 Write/Edit | pre/post → `check:static` |
| エージェント turn 終了 | stop → `harness` |
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

### 門番

§2 と同じ（**編集 → pre/post → stop harness**）。

### 出口

- [ ] config smoke 緑
- [ ] stop harness 緑

**次: §4**

---

## §4 DB 層（@openpbx/db · Phase 3）

**目的**: `applySchema`, migrations, repositories（`T-DB-*`）。

1. root `package.json` の **workspaces** に `packages/pbx-db` を追加
2. **`test:gate`** に `npm test -w @openpbx/db` を追加
3. Red→Green→Refactor（in-memory SQLite fixture）

### 門番

- pre/post: static（新 package の test も対象）
- stop: **harness**（core + db の test:gate）

### 出口

- [ ] `T-DB-*` 対象が Green
- [ ] harness 緑

**次: §5**

---

## §5 Infra 層（@openpbx/infra · Phase 4〜5）

**目的**: ファイル書込、reload、AMI、CDR ingest（`T-INFRA-*`, `T-AMI-*`, `T-CDR-ING-*`）。

### 門番

§4 と同じ。

**次: §6**

---

## §6 API / Actions（apps/web · Phase 6〜6.5）

**目的**: Route Handler、middleware、Server Actions 40 本（`T-MW-*`, `T-API-*`, `T-ACT-*`）。

- **domain logic を `apps/web/src/lib` に書かない**（pre が static で検知）

### 門番

§4 と同じ。Action 契約変更は §7 より先にテスト固定。

**次: §7**

---

## §7 フロント（Phase 7）

**目的**: `docs/FRONTEND-PLAN.md` に沿った画面。TDD 強制なし。Action 名・FormData key は変えない。

### 門番

- UI 編集: pre/post（主に static・secret）
- 結合確認: turn 末 **harness** + 必要なら Playwright（計画 `T-UI-*`）

**次: §8**

---

## §8 通話・本番化（Phase 8〜10）

**目的**: `docker compose up`、9001/9002 inbox、`T-PROD-*`、README 同期。

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
2. `git add` … `git commit` → **pre-commit: check:static**（自動）
3. `git push` → **pre-push: harness**（自動）

### §check リスト

- [ ] `npm run harness` 緑（push でも再実行される）
- [ ] 触った §7 ID が Green または manual-only 記録
- [ ] `TDD-REBUILD-PLAN.md` と実装のズレなし
- [ ] secret / SQLite / 録音を commit していない
- [ ] FRONTEND 変更時、Action・FormData key 不変

### PR テンプレ

```md
## 変更内容
- …

## TDD
- Red: T-XXX-000 …
- Green: …

## 確認（自動門番含む）
- [ ] Cursor stop / pre-push で harness 緑
- [ ] pre-commit static 通過
```

`--no-verify` は緊急時のみ・PR に理由を書く。

---

## 付録: スクリプトとフック一覧

| スクリプト | 内容 |
|------------|------|
| `scripts/check-denwa-static.mjs` | pre/post / pre-commit |
| `scripts/harness-fast.sh` | 手動 TDD |
| `scripts/harness-check.sh` | stop / pre-push |

| Cursor フック | イベント |
|---------------|----------|
| `denwa-pre-tool.sh` | preToolUse |
| `denwa-post-tool.sh` | postToolUse |
| `denwa-after-file-edit.sh` | afterFileEdit / afterTabFileEdit |
| `denwa-stop-harness.sh` | stop |
| `denwa-block-secrets-commit.sh` | beforeShellExecution (git commit) |

| Git | イベント |
|-----|----------|
| `lefthook.yml` | pre-commit static / pre-push harness |
