# denwa

OpenPBX を **TDD で再構築**するリポジトリ。仕様の正本は [`docs/TDD-REBUILD-PLAN.md`](docs/TDD-REBUILD-PLAN.md)。legacy は隣の [OpenPBX](https://github.com/tanimurahifukka/OpenPBX) を読み取り専用で参照（[`docs/LEGACY.md`](docs/LEGACY.md)）。

## クイックスタート（開発）

```bash
npm install          # lefthook を prepare で有効化
npm test             # @openpbx/core の Vitest
npm run check:static # 毎編集（Cursor pre/post）・pre-commit
npm run harness:fast # 手動 TDD（static + typecheck + test）
npm run harness      # stop / pre-push（full test:gate）
```

### ローカル UI のみ（SQLite、Asterisk なし）

```bash
npx tsx scripts/bootstrap-dev-admin.ts
cd apps/web
DATABASE_PATH=../../data/db/command-room.sqlite npm run dev
```

- URL: http://localhost:3000
- ログイン: `admin` / 初回パスワードは OpenPBX README 参照（`bootstrap-dev-admin.ts` も同契約）。本番では必ず変更する。

## ランタイム（Docker Compose + 通話 smoke）

Asterisk + Web をまとめて起動する。

```bash
docker compose up --build
```

| 項目 | 値 |
|------|-----|
| 管理画面 | http://localhost:3000 |
| SIP | UDP/TCP **5060** |
| RTP | **10000–10020**/udp（`asterisk/rtp.conf` と compose で一致） |
| HTTP/WS (Asterisk) | **8088** / TLS **8089** |
| 初回ログイン | `admin` / OpenPBX README の初回パスワード（**本番前に変更**） |

### 特番・録音 inbox

| 番号 | 動作 |
|------|------|
| `9000` | 静的 IVR（1→9001, 2→9002, 0→内線 1001） |
| `9001` | 当日予約録音 → 切断後 `notify-event.sh` が `data/inbox/` に wav + `*.meta.json` |
| `9002` | 折返し依頼（同上、`kind=callback_request`） |
| `_100X` | 内線 + MixMonitor 録音 |

手動 smoke（`manual-only` 可）: 内線 1001/1002 で相互発信、9001/9002 に発信して `data/inbox/` を確認。

### host-tts（開発のみ）

カスタム IVR 音声の `say` 生成は **macOS 開発用**。legacy OpenPBX の `host-tts/` を参照。denwa リポには同梱しない。

## 本番化チェック（§11）

リポジトリ既定値のままでは **意図的に FAIL** する。

```bash
npm run prod-check
# DB まで含める例:
npm run prod-check -- --db data/db/command-room.sqlite
```

| チェック | 内容 |
|----------|------|
| admin password | T-PROD-001（DB の admin 既定パスワード） |
| AMI secret | T-PROD-002（compose / manager.conf） |
| Server Action key | T-PROD-003（compose 固定キー） |
| session cookie | T-PROD-004（本番で `secure: true` 必須） |
| extension secrets | T-PROD-005（内線 1001/1002 既定 secret） |
| AMI permit | T-PROD-006（広い Docker 172.0.0.0/8） |
| IP allow list | T-PROD-007（本番 DB で空リスト禁止） |

秘密をローテーションし、cookie に `secure: true` を付与したうえで `--expect-pass` を使う。

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

## レイアウト

```text
packages/pbx-core   # @openpbx/core（ドメイン・runtime 契約）
packages/pbx-db     # SQLite schema / repos
packages/pbx-infra  # fs, AMI, config writes
apps/web            # Next.js UI, Actions, Route Handlers
asterisk/           # 静的 dialplan / notify-event.sh
docker-compose.yml  # asterisk + web
```
