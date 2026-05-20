# denwa — 手順詳細（steps-denwa）

**メニュー番号 = §番号。** エージェントは **§N 必読を Read してから** 実装する（SKILL.md [critical]）。

**legacy ルート**: `<denwa-root>/../OpenPBX`（以下 `OpenPBX/` と表記）

---

## §必読の読み方

- **denwa**: リポ内 `docs/...` を Read ツールで開く
- **OpenPBX**: `OpenPBX/apps/web/...` など **ワークスペース外** — 絶対パスまたは `../OpenPBX/...` で Read
- ファイルが無い → ユーザーに `git clone` / `git pull` を促す。**推測で実装しない**

---

## §0 基盤・フック（Phase 0）

### §0 必読（実装前）

| 種別 | パス |
|------|------|
| denwa | `docs/TDD-REBUILD-PLAN.md` — §1 スコープ、§12.1 ゲート、§13.1 チェックリスト |
| denwa | `docs/LEGACY.md` — 全文 |
| denwa | `package.json` / `lefthook.yml` / `.cursor/hooks.json` |
| OpenPBX | ディレクトリ存在確認のみ（`OpenPBX/README.md`） |

### 手順

1. `npm install`
2. Cursor Hooks 有効
3. 今回の `T-XXX-000` を 1 つ選ぶ（§7）

**次**: §1 または §2

---

## §1 legacy + golden

### §1 必読

| 種別 | パス |
|------|------|
| denwa | `docs/LEGACY.md` |
| denwa | `docs/TDD-REBUILD-PLAN.md` — §4.4 golden（T-GM-*） |
| OpenPBX | 生成対象に応じて LEGACY 表のファイル（例 `OpenPBX/apps/web/src/lib/extensions.ts`, `OpenPBX/asterisk/extensions.conf`, `OpenPBX/docker-compose.yml`） |

### 手順

- `fixtures/golden/current/` に代表出力を追加
- OpenPBX から **コピペ一括移植しない**

**次**: §2

---

## §2 ドメイン TDD（Phase 1〜2）

### §2 必読

| 種別 | パス |
|------|------|
| denwa | `docs/TDD-REBUILD-PLAN.md` — §7 の **今回の ID 行**（例 T-EXT-*, T-PJSIP-*, T-RG-* …） |
| denwa | `docs/LEGACY.md` |
| OpenPBX | **ID に対応する** `OpenPBX/apps/web/src/lib/<module>.ts`（例 内線 → `extensions.ts`, 着信G → `ringGroups.ts`, CDR → `cdr.ts`, 認証 → `auth.ts`） |

**対応の目安**

| §7 系 | OpenPBX lib |
|-------|-------------|
| T-EXT / T-PJSIP | `extensions.ts`, `pjsip` 関連 |
| T-RG | `ringGroups.ts` |
| T-CDR | `cdr.ts` |
| T-AUTH / T-TOTP | `auth.ts`, `totp.ts` |
| T-BILL | `billing.ts` |
| T-BH | `businessHours.ts` |
| T-IVR | `ivr.ts` |
| T-TRUNK | `trunks.ts` |
| T-PICKUP | `pickupGroups.ts` |
| T-PB | `phonebook.ts` |

### 手順

1. Red（`T-XXX-000: Given …`）→ Green → Refactor
2. 正本は `packages/pbx-core` のみ

**次**: §3 または §4

---

## §3 早期 runtime smoke（Phase 2.5）

### §3 必読

| 種別 | パス |
|------|------|
| denwa | `docs/TDD-REBUILD-PLAN.md` — §7 T-GM-001/009, T-DOCKER-001〜003, T-AST-CONFIG-001 |
| OpenPBX | `OpenPBX/docker-compose.yml`, `OpenPBX/asterisk/extensions.conf`, `OpenPBX/asterisk/pjsip.conf`（存在するもの） |

**次**: §4

---

## §4 DB（Phase 3）

### §4 必読

| 種別 | パス |
|------|------|
| denwa | `docs/TDD-REBUILD-PLAN.md` — §7 T-DB-*, §8 |
| denwa | `docs/LEGACY.md` |
| OpenPBX | `OpenPBX/apps/web/src/lib/db.ts` |

**次**: §5

---

## §5 Infra（Phase 4〜5）

### §5 必読

| 種別 | パス |
|------|------|
| denwa | `docs/TDD-REBUILD-PLAN.md` — §7 T-INFRA-*, T-AMI-*, T-CDR-ING-*, T-CONC-* |
| OpenPBX | `OpenPBX/apps/web/src/lib/dialplan.ts`, `ami.ts`, `cdr.ts`, `originate.ts`, `concurrency.ts`（該当 ID に応じて） |

**次**: §6

---

## §6 API / Actions（Phase 6〜6.5）

### §6 必読

| 種別 | パス |
|------|------|
| denwa | `docs/TDD-REBUILD-PLAN.md` — §2.3〜2.5, §7 T-MW-*, T-API-*, T-ACT-* |
| OpenPBX | `OpenPBX/apps/web/src/app/actions.ts`, `OpenPBX/apps/web/src/middleware.ts`, `OpenPBX/apps/web/src/app/api/**/route.ts`（触る API に対応） |

**次**: §7

---

## §7 フロント（Phase 7）

### §7 必読

| 種別 | パス |
|------|------|
| denwa | `docs/FRONTEND-PLAN.md` |
| denwa | `docs/TDD-REBUILD-PLAN.md` — §2.3 画面一覧, §7 T-UI-* |
| OpenPBX | 対応する `OpenPBX/apps/web/src/app/**/page.tsx`（wire 参照。ロジックはコピーしない） |

**次**: §8

---

## §8 通話・本番化（Phase 8〜10）

### §8 必読

| 種別 | パス |
|------|------|
| denwa | `docs/TDD-REBUILD-PLAN.md` — §7 T-AST-*, T-INBOX-*, T-DOCKER-*, T-WEBRTC-*, T-CHROME-*, T-PROD-*, §11 |
| OpenPBX | `OpenPBX/asterisk/**`, `OpenPBX/docker-compose.yml`, `OpenPBX/asterisk/notify-event.sh`（該当時） |

**次**: §9

---

## §9 共有・PR

### §9 必読

| 種別 | パス |
|------|------|
| denwa | `docs/TDD-REBUILD-PLAN.md` — **§1.4 完了の定義** |
| denwa | 本ファイル §check |

### 手順

- `git commit` → pre-commit static
- `git push` → pre-push harness

---

## §check

- [ ] 触った §7 ID が Green
- [ ] `npm run harness` 緑
- [ ] Step 開始時に §N 必読を Read 済み（パスを報告済み）
- [ ] secret / SQLite / 録音を commit していない

---

## 門番・hooks

| Cursor | Git |
|--------|-----|
| pre/post → static | pre-commit → static |
| stop → harness | pre-push → harness |

設定: `.cursor/hooks.json`, `lefthook.yml`
