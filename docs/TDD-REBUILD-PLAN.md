# OpenPBX 全面 TDD 再構築計画（正本）

**目的**: 現行リポジトリ `OpenPBX` の利用者向け挙動・データ互換・運用手順を、TDD でクリーンに再構築する。  
**重要な定義**: 「0 から」は、設計層を `core/db/infra/web` に分けてテストから作り直すという意味であり、現行コードを無視する意味ではない。現行コードは legacy spec として読み、golden master と移行テストで互換性を固定する。  
**この文書の読者**: 人間・Codex などの実装エージェント。実装順・契約・完了条件の単一正本。  
**注意**: 本文は計画とテスト仕様のみ。実装は別タスクで本計画に従って行う。フロントエンドの見た目・画面構成・UI実装ガイドは `docs/FRONTEND-PLAN.md` を参照するが、認可・API・Server Actions・永続化・副作用の契約は本書を優先する。

**OpenPBX 差分移植**: `/network`、患者、問診、WebRTC ソフトフォン、Chrome 拡張の移植 TDD 詳細は `docs/OPENPBX-GAP-MIGRATION-TDD-PLAN.md` を参照する。

---

## 1. スコープ

### 1.1 再現対象（In scope）

| カテゴリ | 内容 |
|----------|------|
| PBX コア | 内線 PJSIP、着信グループ、ピックアップ、IVR、外線 Trunk、静的 + 動的 dialplan |
| 通話・録音 | 内線通話 MixMonitor、特番 9001/9002 録音、`data/inbox/` への wav + meta.json |
| 履歴・監視 | CDR CSV 取り込み、CDR UI、AMI 端末状態 SSE、同時通話スナップショット |
| 業務・音声 | 祝日/時間帯、ガイダンス wav、host-tts（macOS say） |
| 認証・監査 | Cookie セッション、scrypt、ロール、TOTP 2FA、監査ログ、ログイン履歴 |
| セキュリティ | パスワードポリシー、IP allow list（CIDR）、secret マスキング、本番化検知 |
| 課金 | prefix レート表、CDR からの料金算出 |
| クライアント | Web ソフトフォン（sip.js + wss）、Click-to-call API、Chrome 拡張 |
| 運用 | バージョンアップ予約 UI、動的 conf 書き出し + reload シグナル |
| コンテナ | `docker compose`（Asterisk + Web）、README 記載のポート・初回ログイン |

### 1.2 非スコープ（Out of scope）

| 項目 | 理由 |
|------|------|
| AI 文字起こし・要約 | 別リポ `command-room-ai` が `data/inbox/` を監視する設計 |
| 商用 SLA・マルチテナント | MVP / 学習目的の個人 PBX |
| BIZTEL / RemoTEL との互換 API | 参考実装のみ、プロトコル互換は要求しない |
| Kubernetes / 水平スケール | 単一ホスト Docker 前提 |

### 1.3 互換性の優先順位

| 優先 | 契約 | 方針 |
|------|------|------|
| 1 | ユーザー操作と API 挙動 | 画面/API/Action の棚卸しと E2E で固定 |
| 2 | Asterisk が読む conf と dialplan | golden master + Asterisk smoke で固定 |
| 3 | 既存 SQLite データの移行 | normalized schema + migration test で固定 |
| 4 | 実装内部 | 現行と同じである必要はない |

**禁止**: 「DB スキーマ文字列をバイト単位で同等」にすることを完了条件にしない。互換性は SQLite の `sqlite_schema` 正規化、`PRAGMA table_info/index_list/foreign_key_list`、既存 DB fixture からの migration test、repository の振る舞いで検証する。

### 1.4 完了の定義（プロジェクト全体）

以下をすべて満たしたとき「再現完了」とする。

1. 全ゲート（§12.1）が緑
2. §7 の全テスト ID が `green` または明示的に `manual-only` と記録済み
3. §4.4 の golden master が全て一致し、差分が出る場合は仕様変更としてレビュー済み
4. `docker compose up` 後、README 手順で内線 1 通話と特番 9001 が成功し、`data/inbox/` に wav + meta.json が残る
5. 本番化チェックリスト（§11）の自動検知テストがデフォルト秘密で失敗し、変更後に成功する

---

## 2. 現行システム棚卸し

### 2.1 コンポーネント

```text
[SIP クライアント / Groundwire / WebRTC]
        | SIP 5060, RTP 10000-10020, WSS 8089
        v
[Asterisk]  pjsip.conf + pjsip.d/*.conf
            extensions.conf + dialplan.d/*.conf
            AMI 5038, cdr_csv -> Master.csv
            notify-event.sh -> /inbox
        ^
        | reload signal (/signals/reload)
[Web Next.js 15]  SQLite, Server Actions, Route Handlers
                  middleware (session cookie)
                  lib/* domain + AMI TCP client
```

### 2.2 現行コードの参照マップ

| 領域 | legacy spec |
|------|-------------|
| DB スキーマ・seed | `apps/web/src/lib/db.ts` |
| 内線 | `apps/web/src/lib/extensions.ts` |
| 着信G | `apps/web/src/lib/ringGroups.ts` |
| ピックアップ | `apps/web/src/lib/pickupGroups.ts` |
| IVR | `apps/web/src/lib/ivr.ts` |
| Trunk | `apps/web/src/lib/trunks.ts` |
| 業務時間 | `apps/web/src/lib/businessHours.ts` |
| 電話帳 | `apps/web/src/lib/phonebook.ts` |
| ガイダンス | `apps/web/src/lib/guidances.ts` |
| CDR | `apps/web/src/lib/cdr.ts` |
| 課金 | `apps/web/src/lib/billing.ts` |
| 認証・監査 | `apps/web/src/lib/auth.ts` |
| ポリシー・IP | `apps/web/src/lib/policy.ts`, `packages/pbx-core/src/auth/policy.ts` |
| TOTP | `apps/web/src/lib/totp.ts` |
| AMI 常駐 | `apps/web/src/lib/ami.ts` |
| Originate | `apps/web/src/lib/originate.ts` |
| dialplan 書込 | `apps/web/src/lib/dialplan.ts` |
| 同時通話 | `apps/web/src/lib/concurrency.ts` |
| アップグレード | `apps/web/src/lib/upgrades.ts` |
| Server Actions | `apps/web/src/app/actions.ts` |
| middleware | `apps/web/src/middleware.ts` |
| 静的 dialplan | `asterisk/extensions.conf` |
| inbox 投下 | `asterisk/notify-event.sh` |
| reload watcher | `asterisk/entrypoint.sh` |
| Compose | `docker-compose.yml` |
| Chrome 拡張 | `chrome-extension/*` |
| TTS | `host-tts/make-prompts.sh` |

### 2.3 画面一覧

| URL | 機能 | 認可 |
|-----|------|------|
| `/` | ダッシュボード | user+ |
| `/login` | ログイン | public |
| `/extensions` | 内線 CRUD | user+ |
| `/devices` | AMI SSE 端末状態 | user+ |
| `/ring-groups` | 着信グループ | user+ |
| `/pickup-groups` | ピックアップ | user+ |
| `/phonebook` | 電話帳 | user+ |
| `/business-hours` | 祝日・時間帯 | user+ |
| `/ivr` | IVR エディタ | user+ |
| `/guidances` | ガイダンス wav | user+ |
| `/cdr` | 発着信履歴 | user+ |
| `/recordings` | 録音一覧・再生 | user+ |
| `/concurrency` | 同時通話グラフ | user+ |
| `/softphone` | WebRTC ソフトフォン | user+ |
| `/billing` | 課金 | supervisor+ |
| `/audit` | 監査・ログイン履歴 | supervisor+ |
| `/accounts` | アカウント | admin |
| `/security` | ポリシー・IP | admin |
| `/trunks` | SIP trunk | admin |
| `/upgrades` | バージョンアップ予約 | admin |
| `/me` | マイアカウント・2FA | self |

### 2.4 Route Handlers

| Method | Path | 用途 | 認可 |
|--------|------|------|------|
| GET/POST | `/api/cdr/ingest` | CDR 手動/定期取り込み | supervisor+ |
| GET | `/api/devices/stream` | SSE 端末状態 | user+ |
| GET/POST | `/api/extensions` | REST 内線 | user+ |
| GET/DELETE | `/api/extensions/[number]` | REST 内線個別 | user+ |
| POST | `/api/originate` | Click-to-call | user+ |
| GET | `/api/phonebook/lookup` | 番号逆引き | user+ |
| GET/POST | `/api/guidances` | ガイダンス一覧/アップロード | user+ |
| GET | `/api/recordings/[file]` | 録音ストリーム | user+ |
| GET | `/api/health` | health check（実装する場合） | public |

### 2.5 Server Actions（現行 40 本）

| # | Action | 認可 | 監査 action |
|---|--------|------|-------------|
| 1 | `createExtensionAction` | user+ | `extension.create` |
| 2 | `updateExtensionAction` | user+ | `extension.update` |
| 3 | `deleteExtensionAction` | user+ | `extension.delete` |
| 4 | `createRingGroupAction` | user+ | `ring_group.create` |
| 5 | `updateRingGroupAction` | user+ | `ring_group.update` |
| 6 | `deleteRingGroupAction` | user+ | `ring_group.delete` |
| 7 | `createPickupGroupAction` | user+ | `pickup.create` |
| 8 | `updatePickupGroupAction` | user+ | `pickup.update` |
| 9 | `deletePickupGroupAction` | user+ | `pickup.delete` |
| 10 | `createPhonebookAction` | user+ | `phonebook.create` |
| 11 | `updatePhonebookAction` | user+ | `phonebook.update` |
| 12 | `deletePhonebookAction` | user+ | `phonebook.delete` |
| 13 | `upsertHolidayAction` | user+ | `holiday.upsert` |
| 14 | `deleteHolidayAction` | user+ | `holiday.delete` |
| 15 | `createTimeRuleAction` | user+ | `time_rule.create` |
| 16 | `updateTimeRuleAction` | user+ | `time_rule.update` |
| 17 | `deleteTimeRuleAction` | user+ | `time_rule.delete` |
| 18 | `upsertIvrAction` | user+ | `ivr.upsert` |
| 19 | `deleteIvrAction` | user+ | `ivr.delete` |
| 20 | `deleteGuidanceAction` | user+ | `guidance.delete` |
| 21 | `loginAction` | public | `login` / `login.failed` |
| 22 | `logoutAction` | user+ | `logout` |
| 23 | `setupTotpAction` | self | `totp.setup` |
| 24 | `disableTotpAction` | self | `totp.disable` |
| 25 | `updateMyDisplayNameAction` | self | `account.self.display_name.update` |
| 26 | `updateMyPasswordAction` | self | `account.self.password.update` |
| 27 | `createAccountAction` | admin | `account.create` |
| 28 | `updateAccountRoleAction` | admin | `account.role.update` |
| 29 | `updateAccountDisplayNameAction` | admin | `account.display_name.update` |
| 30 | `updateAccountPasswordAction` | admin | `account.password.update` |
| 31 | `deleteAccountAction` | admin | `account.delete` |
| 32 | `updatePolicyAction` | admin | `policy.update` |
| 33 | `upsertIpAllowAction` | admin | `ip_allow.upsert` |
| 34 | `deleteIpAllowAction` | admin | `ip_allow.delete` |
| 35 | `upsertRateAction` | supervisor+ | `billing_rate.upsert` |
| 36 | `deleteRateAction` | supervisor+ | `billing_rate.delete` |
| 37 | `upsertTrunkAction` | admin | `trunk.upsert` |
| 38 | `deleteTrunkAction` | admin | `trunk.delete` |
| 39 | `scheduleUpgradeAction` | admin | `upgrade.schedule` |
| 40 | `deleteUpgradeAction` | admin | `upgrade.delete` |

### 2.6 特番・静的 dialplan

| 番号 | 動作 |
|------|------|
| `_100X` | 内線同士 Dial + MixMonitor 録音 |
| `9000` | 静的 IVR（custom 音声、1 -> 9001, 2 -> 9002, 0 -> 1001） |
| `9001` | 当日予約録音 -> h extension -> notify-event |
| `9002` | 折返し録音 -> h extension -> notify-event |
| `*8` | 動的 `pickup.conf` で Pickup() |
| `6XXX` 帯 | 着信グループ（動的 `ringgroups` context） |
| DB 駆動 IVR | 動的 `ivr.conf`（`/ivr` 画面） |

### 2.7 棚卸しの自動検査

実装時は `scripts/inventory-openpbx.mjs`（新規）を作り、以下を検出して本書と照合する。

| 対象 | 検出方法 | 失敗条件 |
|------|----------|----------|
| Pages | `apps/web/src/app/**/page.tsx` | §2.3 に存在しない |
| Route Handlers | `apps/web/src/app/api/**/route.ts` | §2.4 に存在しない |
| Server Actions | `export async function *Action` | §2.5 と数/名前が不一致 |
| Env vars | `process.env.*`, `docker-compose.yml` | §10 と不一致 |
| 動的生成ファイル | `write*Config*`, `DIALPLAN_OUT_DIR`, `PJSIP_OUT_DIR` | §9 と不一致 |

---

## 3. 目標アーキテクチャとパッケージ

### 3.1 依存方向（厳守）

```text
packages/pbx-core   (@openpbx/core)   pure domain, no fs/db/network
packages/pbx-db     (@openpbx/db)     SQLite schema, migrations, repositories
packages/pbx-infra  (@openpbx/infra)  fs, AMI, originate, inbox, config writes
apps/web            (command-room-web) Next.js UI, Actions, Route Handlers
asterisk/ + docker-compose.yml        runtime templates and mounts
chrome-extension/                         client, depends on HTTP API contract
host-tts/                                 dev-only prompt generation
```

### 3.2 Root workspace 契約

| 項目 | 値 |
|------|----|
| root package | `openpbx` |
| workspaces | `apps/web`, `packages/pbx-core`, `packages/pbx-db`, `packages/pbx-infra` |
| existing core package name | `@openpbx/core` |
| new db package name | `@openpbx/db` |
| new infra package name | `@openpbx/infra` |
| web package name | `command-room-web` |

**禁止**: テストコマンド内で §3.2 にない未定義 package 名を使わない。

### 3.3 単一正本ルール

| 関心事 | 正本 | Web は |
|--------|------|--------|
| バリデーション | `@openpbx/core` | import のみ |
| conf/dialplan 文字列生成 | `@openpbx/core` | import のみ |
| CDR CSV パース | `@openpbx/core` | import のみ |
| 課金計算 | `@openpbx/core` | import のみ |
| SQL・CRUD | `@openpbx/db` | repository 呼び出し |
| ファイル・AMI・inbox | `@openpbx/infra` | adapter 呼び出し |

**禁止**: `apps/web/src/lib/*` に検証ロジックや dialplan 生成の二重実装を残したまま wired 完了としない。移行中の一時重複は `T-GM-*` と import 境界テストで差分検知する。

---

## 4. TDD ルールとテスト階層

### 4.1 サイクル

1. **Red**: §7 の契約 ID に対応するテストを追加し、意図的に失敗させる
2. **Green**: その ID だけを通す最小実装
3. **Refactor**: 重複除去・正本パッケージへの移動。期待値は変更しない
4. **Wire**: `apps/web` が正本 package を import するまで、その機能は完了扱いにしない

### 4.2 テスト階層

| 層 | ツール | 配置 | 実行頻度 |
|----|--------|------|----------|
| L0 domain unit | Vitest | `packages/pbx-core` | 毎コミット |
| L1 DB integration | Vitest + `:memory:` SQLite + fixture DB | `packages/pbx-db` | 毎コミット |
| L2 infra unit/integration | Vitest + temp dir / AMI mock socket | `packages/pbx-infra` | 毎コミット |
| L3 API/Action contract | Vitest + Next test helpers | `apps/web` | PR |
| L4 E2E smoke | Playwright | `e2e/` | PR の最小 smoke / nightly の通話前提 |
| L5 runtime manual | README 手順 | human | リリース前 |

### 4.3 命名規約

| 項目 | 規約 |
|------|------|
| テスト名 | `T-XXX-000: Given <condition> When <action> Then <result>` |
| ID | §7 に明示されたものだけを使う |
| 粒度 | 1 テスト = 1 振る舞い。複数 assert は同一事後条件のみ |
| todo | `it.todo` は ID 付きのみ許可 |
| skip | `it.skip` は禁止。manual-only は §12.2 の進捗表で管理 |

### 4.4 Golden master

`fixtures/golden/current/`（新規）に現行挙動の代表出力を保存する。golden は「現行と同じこと」を守るためのもので、設計改善を禁止するものではない。仕様変更する場合は fixture 更新 PR に理由を書く。

| ID | Fixture | 検証対象 |
|----|---------|----------|
| T-GM-001 | `pjsip/extensions.conf` | 内線 1001/1002 + WebRTC 断片 |
| T-GM-002 | `dialplan/ringgroups.conf` | ringall/linear/空メンバー |
| T-GM-003 | `dialplan/pickup.conf` | `*8` Pickup |
| T-GM-004 | `dialplan/ivr.conf` | DB 駆動 IVR |
| T-GM-005 | `dialplan/trunks.conf` | inbound DID + outbound prefix |
| T-GM-006 | `dialplan/business-hours.conf` | 祝日 + GotoIfTime |
| T-GM-007 | `cdr/master-row.csv` + `cdr/parsed.json` | Asterisk 18 フィールド CSV |
| T-GM-008 | `inbox/meta.json` | notify-event meta schema |
| T-GM-009 | `docker/compose-normalized.json` | compose service/volume/port 正規化 |

### 4.5 TDD 必須範囲

| 領域 | 対象 | 理由 |
|------|------|------|
| Domain | `@openpbx/core` | PBX契約の正本。副作用なしで最もTDD向き |
| DB | `@openpbx/db` | 既存データ互換、制約、transaction の破壊を防ぐ |
| Infra | `@openpbx/infra` | ファイル書込、reload、AMI、path traversal など事故りやすい |
| Runtime config | `asterisk/*`, `docker-compose.yml` | Asterisk が読めないと全体が動かない |
| API | `apps/web/src/app/api/**/route.ts` | 認証・認可・入力検証・secret masking の境界 |
| Server Actions | `apps/web/src/app/actions.ts` | CRUD、監査、reload のアプリケーション境界 |
| Middleware/Auth | `middleware.ts`, auth helpers | cookie存在チェックだけに依存しないため |
| Security/Prod check | default secret, cookie, AMI permit | 本番事故を自動検知するため |
| Golden master | generated conf, CDR, inbox meta | 現行同等性を人間の記憶に依存させないため |
| Inventory | pages/routes/actions/env/generated files | 計画と実装のズレを検知するため |

### 4.6 TDD 必須ではない範囲

| 領域 | 扱い |
|------|------|
| 画面レイアウト | `docs/FRONTEND-PLAN.md` とレビューで管理 |
| Tailwind class の細部 | snapshot 乱用しない |
| 全ページ DOM snapshot | 書かない |
| 見た目の色・余白 | 画面レビューで確認 |
| Chrome 拡張の細かい UI | 契約 mock と手動で確認 |

`apps/web` 配下でも Route Handler、Server Action、middleware、`requireAccount` / `requireRole`、flash redirect、secret masking、audit log、reload/file write 呼び出しはフロントではなくアプリケーション境界として TDD 対象にする。一方、`page.tsx` の見た目、form 配置、table 表示、loading/empty/error の見せ方は `FRONTEND-PLAN.md` の担当。

### 4.7 Red / Green / Refactor 判定

Red は「テストファイルが存在する」だけでは不十分。以下のいずれかで実際に失敗していること。

| 種別 | Red 例 |
|------|--------|
| 未実装 import | export が存在しない |
| 未対応分岐 | expected error が返らない |
| golden master | 出力差分が出る |
| DB | table/constraint/repository が存在しない |
| API | 401/403/400 が返らない |
| security | default secret を検知できない |

Green は以下を満たす。

- 対象 ID のテストが通る
- 既存テストを壊さない
- その ID 以外の大きな実装を混ぜない
- typed error または明確な戻り値で失敗分岐を表現する
- `apps/web` に domain logic を増やさない

Refactor でやってよいこと:

- 重複除去
- pure function の `@openpbx/core` 移動
- repository の transaction 境界整理
- infra adapter の interface 化
- mock helper / fixture helper の整備

Refactor でやってはいけないこと:

- テスト期待値を都合よく緩める
- golden master 差分を理由なしに更新する
- UI から backend contract を変える
- authorization をフロント表示制御に逃がす

### 4.8 Coverage Gate

| package / area | branch coverage |
|----------------|----------------:|
| `@openpbx/core` | 90% 以上 |
| `@openpbx/db` | 85% 以上 |
| `@openpbx/infra` | 85% 以上 |
| API / Actions / middleware | 80% 以上 |
| global | 80% 以上 |

初期は `command-room-web` の API/Actions/middleware を 70% から始めてよい。ただし Phase 8 完了までに 80% へ引き上げる。

### 4.9 数字より優先する必須分岐

以下は coverage 数字に関係なく必ずテストする。

- 未ログイン
- 権限不足
- admin / supervisor / user の secret masking
- invalid FormData
- DB unique violation
- DB transaction rollback
- path traversal
- AMI timeout / error
- CDR malformed line
- CDR partial line
- default secret detection
- production cookie secure
- last admin guard
- TOTP 誤コード
- IP allow deny

---

## 5. フェーズ計画

各フェーズの出口は、列挙したテスト ID が `green` になり、§12 の該当ゲートを通過すること。

### Phase 0 — リポジトリ基盤と棚卸し

| 項目 | 内容 |
|------|------|
| 成果物 | workspaces, root scripts, Vitest config, CI 雛形, inventory script |
| テスト ID | T-REPO-001〜006, T-INV-001〜005 |
| 出口 | 現行の Pages/API/Actions/Env の棚卸しが本書と一致 |

### Phase 1 — ドメイン基礎

| 項目 | 内容 |
|------|------|
| 成果物 | extension, pjsip, ring-group, cdr/csv, auth/password/policy/access |
| テスト ID | T-EXT-001〜007, T-PJSIP-001〜005, T-RG-001〜006, T-CDR-001〜006, T-AUTH-001〜010 |
| 出口 | `@openpbx/core` の既存テストを ID 付きに置換 |

### Phase 2 — ドメイン拡張

| 項目 | 内容 |
|------|------|
| 成果物 | billing, business-hours, ivr, trunk, pickup, phonebook, filename, totp, guidance, upgrade, originate validation |
| テスト ID | T-BILL-001〜006, T-BH-001〜010, T-IVR-001〜010, T-TRUNK-001〜010, T-PICKUP-001〜005, T-PB-001〜006, T-DP-001〜004, T-TOTP-001〜004, T-GUID-001〜005, T-UPG-001〜003, T-ORIG-001〜004 |
| 出口 | core が副作用ゼロのまま全 domain 契約を保持 |

### Phase 2.5 — 早期 Asterisk smoke

| 項目 | 内容 |
|------|------|
| 成果物 | 最小 pjsip/dialplan fixture、`docker compose config`、Asterisk 設定読込 smoke |
| テスト ID | T-GM-001, T-GM-009, T-DOCKER-001〜003, T-AST-CONFIG-001 |
| 出口 | UI/DB 前でも Asterisk が最小 conf を読めることを確認 |

### Phase 3 — DB 層（`@openpbx/db`）

| 項目 | 内容 |
|------|------|
| 成果物 | `applySchema`, `createInMemoryDb`, migrations, repositories, seed |
| テスト ID | T-DB-001〜026 |
| 出口 | 既存 DB fixture からの migration と repository 振る舞いが緑 |

### Phase 4 — Infra 書き出し（`@openpbx/infra`）

| 項目 | 内容 |
|------|------|
| 成果物 | write file, atomic write, reload signal, sounds, recordings, path traversal guard |
| テスト ID | T-INFRA-001〜014 |
| 出口 | core render -> infra write -> golden/snapshot が一致 |

### Phase 5 — AMI・CDR ingest・同時通話

| 項目 | 内容 |
|------|------|
| 成果物 | AMI parser/client, SSE emitter, originate, CDR tail, concurrency MAX |
| テスト ID | T-AMI-001〜006, T-CDR-ING-001〜006, T-CONC-001〜004 |
| 出口 | mock socket / fixture CSV で全て再現可能 |

### Phase 6 — HTTP API・middleware

| 項目 | 内容 |
|------|------|
| 成果物 | 全 Route Handler, session validation, role enforcement, IP allow enforcement |
| テスト ID | T-MW-001〜006, T-API-001〜018 |
| 出口 | cookie 存在だけで通さず、handler 側でも requireAccount/role を検証 |

### Phase 6.5 — Server Actions TDD

| 項目 | 内容 |
|------|------|
| 成果物 | `actions.ts` 40 本の認可・監査・副作用契約 |
| テスト ID | T-ACT-001〜040 |
| 出口 | Claude 等が画面を作っても Action の業務契約が固定されている |

Action test は `redirect` / `revalidatePath` を mock し、DB は in-memory または temp DB、infra side effect は mock adapter、request meta は固定 fixture、FormData は実 `FormData` を使う。

必須の失敗分岐:

- 未ログイン
- 権限不足
- invalid FormData
- duplicate DB error
- reload failure
- last admin delete / role downgrade
- password policy violation
- CIDR invalid
- trunk validation error

### Phase 7 — Frontend implementation・UI contract

| 項目 | 内容 |
|------|------|
| 成果物 | `FRONTEND-PLAN.md` に沿った全 page, flash pattern, ConfirmButton, FlashBanner |
| テスト ID | T-UI-001〜021, T-E2E-001〜004 |
| 出口 | Action 名・FormData key・API URL を変えず、UI が契約に wire されている |

### Phase 8 — Asterisk・Docker・録音・inbox

| 項目 | 内容 |
|------|------|
| 成果物 | `asterisk/*`, `docker-compose.yml`, `notify-event.sh`, `entrypoint.sh`, 特番 dialplan |
| テスト ID | T-AST-001〜008, T-DOCKER-001〜006, T-INBOX-001〜006 |
| 出口 | 9001/9002 の meta.json と wav コピーが fixture/schema に一致 |

### Phase 9 — WebRTC・Chrome 拡張

| 項目 | 内容 |
|------|------|
| 成果物 | `/softphone`, mkcert 手順, manifest v3, tel: click-to-call |
| テスト ID | T-WEBRTC-001〜005, T-CHROME-001〜004 |
| 出口 | API mock と手動 wss 登録手順が README と一致 |

### Phase 10 — 本番化・セキュリティ・ドキュメント

| 項目 | 内容 |
|------|------|
| 成果物 | prod check, README 同期, hardcoded secret detection, release checklist |
| テスト ID | T-PROD-001〜010, T-DOC-001〜004 |
| 出口 | デフォルト秘密では prod check が失敗し、変更後に成功 |

---

## 6. 機能トレーサビリティマトリクス

| # | 機能 | Phase | Domain | DB | Infra/Runtime | API/UI |
|---|------|-------|--------|----|---------------|--------|
| F01 | 内線 CRUD | 1,3,4,7 | T-EXT, T-PJSIP | T-DB-004, T-DB-005 | T-INFRA-005, T-INFRA-006 | T-API-005〜008, T-ACT-001〜003, T-UI-003 |
| F02 | PJSIP 自動生成 | 1,2.5,4 | T-PJSIP | T-DB-004 | T-GM-001, T-INFRA-005 | T-E2E-003 |
| F03 | 着信グループ | 1,3,4,7 | T-RG | T-DB-006 | T-GM-002, T-INFRA-007 | T-ACT-004〜006, T-UI-005 |
| F04 | ピックアップ | 2,3,4,7 | T-PICKUP | T-DB-007 | T-GM-003, T-INFRA-008 | T-ACT-007〜009, T-UI-006 |
| F05 | IVR DB 駆動 | 2,3,4,7 | T-IVR | T-DB-010 | T-GM-004, T-INFRA-009 | T-ACT-018〜019, T-UI-009 |
| F06 | 静的 IVR 9000 | 2.5,8 | T-AST-004 | - | T-AST-004 | T-E2E-004 |
| F07 | 特番 9001/9002 | 8 | T-INBOX | - | T-INBOX-001〜006 | T-E2E-004 |
| F08 | SIP Trunk | 2,3,4,7 | T-TRUNK | T-DB-023 | T-GM-005, T-INFRA-010 | T-ACT-037〜038, T-UI-019 |
| F09 | 電話帳 | 2,3,6,7 | T-PB | T-DB-008 | - | T-API-012, T-ACT-010〜012, T-UI-007 |
| F10 | 業務時間 | 2,3,4,7 | T-BH | T-DB-009 | T-GM-006, T-INFRA-011 | T-ACT-013〜017, T-UI-008 |
| F11 | ガイダンス wav | 2,3,4,6,7 | T-GUID | T-DB-011 | T-INFRA-012 | T-API-013〜014, T-ACT-020, T-UI-010 |
| F12 | CDR 一覧 | 1,3,5,7 | T-CDR | T-DB-012, T-DB-013 | T-CDR-ING | T-API-001〜002, T-UI-011 |
| F13 | 課金 | 2,3,7 | T-BILL | T-DB-020 | - | T-ACT-035〜036, T-UI-015 |
| F14 | 録音再生 | 4,6,7 | T-DP | - | T-INFRA-013 | T-API-015〜016, T-UI-012 |
| F15 | AMI 端末 SSE | 5,6,7 | - | - | T-AMI | T-API-003〜004, T-UI-004 |
| F16 | 同時通話 | 5,7 | T-CONC | T-DB-021 | T-AMI, T-CONC | T-UI-013 |
| F17 | ログイン・セッション | 1,3,6,7 | T-AUTH | T-DB-015, T-DB-016 | - | T-MW, T-ACT-021〜022, T-UI-002 |
| F18 | TOTP 2FA | 2,7 | T-TOTP | T-DB-015 | - | T-ACT-023〜024, T-UI-021 |
| F19 | ロール・監査 | 1,3,6,7 | T-AUTH | T-DB-017 | - | T-MW, T-ACT, T-UI-016 |
| F20 | パスワードポリシー | 1,3,7 | T-AUTH | T-DB-018 | - | T-ACT-032, T-UI-018 |
| F21 | IP allow list | 1,3,6,7 | T-AUTH | T-DB-019 | - | T-MW-005, T-ACT-033〜034, T-UI-018 |
| F22 | Click-to-call | 2,5,6,9 | T-ORIG | - | T-AMI-005, T-AMI-006 | T-API-009〜011, T-CHROME |
| F23 | WebRTC ソフトフォン | 1,9 | T-PJSIP | T-DB-004 | T-WEBRTC | T-UI-014 |
| F24 | アップグレード予約 | 2,3,7 | T-UPG | T-DB-022 | - | T-ACT-039〜040, T-UI-020 |
| F25 | reload シグナル | 4,8 | - | - | T-INFRA-004, T-AST-003 | T-E2E-003 |
| F26 | host-tts | 8,10 | - | - | T-DOC-004 | manual |
| F27 | ダッシュボード | 7 | - | repository summaries | - | T-UI-001 |

補足: `T-ACT-*` は Phase 6.5 の TDD 対象、`T-UI-*` は Phase 7 の frontend contract 対象。機能行の Phase に `7` が含まれる場合でも、Action の認可・監査・reload 契約は Phase 6.5 で先に固定する。

---

## 7. テストカタログ（全契約 ID）

### T-REPO / T-INV — 基盤と棚卸し

| ID | Given | When | Then |
|----|-------|------|------|
| T-REPO-001 | clean clone | `npm install` | workspaces が解決する |
| T-REPO-002 | root package | `npm run test:gate` | phase 有効範囲の全 test が走る |
| T-REPO-003 | `@openpbx/core` | `npm test -w @openpbx/core` | exit 0 |
| T-REPO-004 | `@openpbx/db` 作成後 | `npm test -w @openpbx/db` | exit 0 |
| T-REPO-005 | `@openpbx/infra` 作成後 | `npm test -w @openpbx/infra` | exit 0 |
| T-REPO-006 | CI workflow | push/PR | gate が実行される |
| T-INV-001 | `page.tsx` | inventory 実行 | §2.3 と一致 |
| T-INV-002 | `route.ts` | inventory 実行 | §2.4 と一致 |
| T-INV-003 | `*Action` exports | inventory 実行 | 40 本、§2.5 と一致 |
| T-INV-004 | env vars | inventory 実行 | §10 と一致 |
| T-INV-005 | generated conf writes | inventory 実行 | §9 と一致 |

### T-GM — Golden master

| ID | Given | When | Then |
|----|-------|------|------|
| T-GM-001 | 内線 fixtures | render PJSIP | golden `pjsip/extensions.conf` と一致 |
| T-GM-002 | ring group fixtures | render dialplan | golden `ringgroups.conf` と一致 |
| T-GM-003 | pickup fixtures | render dialplan | golden `pickup.conf` と一致 |
| T-GM-004 | IVR fixtures | render dialplan | golden `ivr.conf` と一致 |
| T-GM-005 | trunk fixtures | render configs | golden `trunks.conf` と一致 |
| T-GM-006 | business-hours fixtures | render dialplan | golden `business-hours.conf` と一致 |
| T-GM-007 | Master.csv row | parse | golden parsed JSON と一致 |
| T-GM-008 | notify-event args | build meta | golden meta JSON schema と一致 |
| T-GM-009 | docker-compose.yml | normalized config | golden compose JSON と一致 |

### T-EXT / T-PJSIP / T-RG / T-CDR — Domain Phase 1

| ID | Given | When | Then |
|----|-------|------|------|
| T-EXT-001 | 2〜6 桁番号 | validateExtensionNumber | ok |
| T-EXT-002 | 1 桁 or 7 桁 | validateExtensionNumber | error |
| T-EXT-003 | secret 4 文字以上 | validateExtensionSecret | ok |
| T-EXT-004 | secret に `"` | validateExtensionSecret | error |
| T-EXT-005 | 正常 draft | validateExtensionDraft | error なし |
| T-EXT-006 | webrtc flag | normalize draft | boolean として保持 |
| T-EXT-007 | display/note 空文字 | normalize draft | undefined または空として一貫 |
| T-PJSIP-001 | 内線 1001 | renderPjsipExtensions | endpoint/auth/aor が含まれる |
| T-PJSIP-002 | callerid あり | render | callerid が含まれる |
| T-PJSIP-003 | pickup group 名付き | render | named_call_group/pickup_group が含まれる |
| T-PJSIP-004 | webrtc true | render | endpoint-webrtc template を使う |
| T-PJSIP-005 | secret に unsafe 文字 | render 前 validate | 出力しない |
| T-RG-001 | 正常 ringall | validateRingGroupDraft | ok |
| T-RG-002 | 呼出秒が短すぎる | validate | error |
| T-RG-003 | 空メンバー | renderRingGroupDialplan | Playback(invalid) |
| T-RG-004 | ringall + 2 members | render | 同時 Dial |
| T-RG-005 | linear + priority | render | priority 順 Dial |
| T-RG-006 | fallback extension | render | Dial 失敗後 fallback |
| T-CDR-001 | quoted comma | parseCsvLine | 分割されない |
| T-CDR-002 | escaped quote | parseCsvLine | quote 復元 |
| T-CDR-003 | 18 fields | cdrRowFromCsvLine | uniqueid/start/dst を取得 |
| T-CDR-004 | fields 不足 | cdrRowFromCsvLine | null |
| T-CDR-005 | duration/billsec 数値 | cdrRowFromCsvLine | number へ変換 |
| T-CDR-006 | 空日時 | cdrRowFromCsvLine | null または空として一貫 |

### T-AUTH / T-TOTP — 認証・認可

| ID | Given | When | Then |
|----|-------|------|------|
| T-AUTH-001 | 平文 password | hash + verify | true |
| T-AUTH-002 | 誤 password | verify | false |
| T-AUTH-003 | password policy | validate | 長さ/大文字/数字/記号を判定 |
| T-AUTH-004 | CIDR allow list 空 | isIpAllowed | true |
| T-AUTH-005 | CIDR match | isIpAllowed | true |
| T-AUTH-006 | CIDR mismatch | isIpAllowed | false |
| T-AUTH-007 | admin | extensionForRole | secret 付き |
| T-AUTH-008 | user | extensionForRole | secret なし |
| T-AUTH-009 | supervisor | canViewAudit | true |
| T-AUTH-010 | user | canViewAudit | false |
| T-TOTP-001 | secret + 同時刻 code | verifyTotp | true |
| T-TOTP-002 | 誤 code | verifyTotp | false |
| T-TOTP-003 | otpauth URI | buildOtpauthUri | issuer/account/secret を含む |
| T-TOTP-004 | base32 bytes | encode/decode | roundtrip |

### T-BILL / T-BH / T-IVR / T-TRUNK

| ID | Given | When | Then |
|----|-------|------|------|
| T-BILL-001 | 複数 prefix | pickRateForDst | 最長 prefix 優先 |
| T-BILL-002 | 該当なし | pickRateForDst | null |
| T-BILL-003 | billsec 0 | computeCallCost | 0 |
| T-BILL-004 | 60 秒 10 円/分 | computeCallCost | 10 |
| T-BILL-005 | setup fee | billingRowCost | setup を加算 |
| T-BILL-006 | 小数 | billingRowCost | 契約通り丸め |
| T-BH-001 | mon-fri | asteriskToDays | 5 日 |
| T-BH-002 | 月〜金 | daysToAsterisk | `mon-fri` |
| T-BH-003 | 全曜日 | daysToAsterisk | `*` |
| T-BH-004 | 不正日付 | validateHolidayDate | error |
| T-BH-005 | 空 holiday 名 | validateHolidayName | error |
| T-BH-006 | 正常 time rule | validateTimeRuleDraft | ok |
| T-BH-007 | start >= end | validateTimeRuleDraft | error |
| T-BH-008 | holiday | renderBusinessHoursDialplan | holiday 分岐 |
| T-BH-009 | time rule | renderBusinessHoursDialplan | GotoIfTime |
| T-BH-010 | 複数 rule | renderBusinessHoursDialplan | 安定順序 |
| T-IVR-001 | 正常 menu | validateIvrDraft | ok |
| T-IVR-002 | digit 重複 | validate | error |
| T-IVR-003 | prompt unsafe | validate | error |
| T-IVR-004 | extension target | render | Goto internal extension |
| T-IVR-005 | ringgroup target | render | Goto ringgroups context |
| T-IVR-006 | guidance prompt | render | Playback/Background |
| T-IVR-007 | invalid/timeout | render | retry 分岐 |
| T-IVR-008 | max retries | render | give-up 分岐 |
| T-IVR-009 | wait seconds | render | WaitExten |
| T-IVR-010 | options 空 | validate | error |
| T-TRUNK-001 | 正常 trunk | validateTrunkDraft | ok |
| T-TRUNK-002 | port 範囲外 | validate | error |
| T-TRUNK-003 | name unsafe | validate | error |
| T-TRUNK-004 | registration true | renderPjsip | registration block |
| T-TRUNK-005 | registration false | renderPjsip | registration なし |
| T-TRUNK-006 | DID inbound | renderDialplan | inbound Goto |
| T-TRUNK-007 | outbound prefix | renderDialplan | Dial(PJSIP/trunk) |
| T-TRUNK-008 | auth secret | renderPjsip | auth section |
| T-TRUNK-009 | from_user/domain | renderPjsip | from fields |
| T-TRUNK-010 | unsafe value | validate before render | 出力しない |

### T-PICKUP / T-PB / T-DP / T-GUID / T-UPG / T-ORIG

| ID | Given | When | Then |
|----|-------|------|------|
| T-PICKUP-001 | 正常 name/members | validatePickupGroupDraft | ok |
| T-PICKUP-002 | 空 name | validate | error |
| T-PICKUP-003 | 不正 member | validate | error |
| T-PICKUP-004 | group | renderPickupDialplan | `*8` Pickup |
| T-PICKUP-005 | multiple groups | render | stable order |
| T-PB-001 | 括弧付き番号 | normalizePhoneNumber | 数字中心に正規化 |
| T-PB-002 | 正常 entry | validatePhonebookDraft | ok |
| T-PB-003 | 空 name | validate | error |
| T-PB-004 | 空 number | validate | error |
| T-PB-005 | lookup exact | lookupPhonebook | hit |
| T-PB-006 | lookup normalized | lookupPhonebook | normalized hit |
| T-DP-001 | `ivr.conf` | validateConfFileName | ok |
| T-DP-002 | `../evil.conf` | validateConfFileName | error |
| T-DP-003 | slash/backslash | validateConfFileName | error |
| T-DP-004 | non `.conf` | validateConfFileName | error |
| T-GUID-001 | 正常 name | validateGuidanceName | ok |
| T-GUID-002 | unsafe name | validateGuidanceName | error |
| T-GUID-003 | 非 RIFF bytes | validateWavHeader | error |
| T-GUID-004 | 正常 wav | validateWavHeader | ok |
| T-GUID-005 | wav 保存 | saveGuidanceWav | sounds 配下 + DB 行 |
| T-UPG-001 | ISO scheduledAt | validateUpgradeDraft | ok |
| T-UPG-002 | 不正日時 | validateUpgradeDraft | error |
| T-UPG-003 | image tag 空 | validateUpgradeDraft | error |
| T-ORIG-001 | valid from/to | validateOriginateRequest | ok |
| T-ORIG-002 | invalid from | validateOriginateRequest | error |
| T-ORIG-003 | invalid to | validateOriginateRequest | error |
| T-ORIG-004 | callerId | buildOriginateAction | AMI fields が正しい |

### T-DB — SQLite / repository

| ID | Given | When | Then |
|----|-------|------|------|
| T-DB-001 | empty db | applySchema | 全 table が存在 |
| T-DB-002 | empty db | applySchema | required index/FK が存在 |
| T-DB-003 | legacy fixture db | migrate | 不足列が冪等追加 |
| T-DB-004 | empty db | seed | 1001/1002 extensions |
| T-DB-005 | extensions repo | create/update/delete | 制約違反を扱う |
| T-DB-006 | ring_groups repo | upsert + members | CASCADE と priority |
| T-DB-007 | pickup repo | upsert + members | CASCADE |
| T-DB-008 | phonebook repo | CRUD/search | number/name index |
| T-DB-009 | holidays/time_rules repo | CRUD | unique/check 相当 |
| T-DB-010 | ivr repo | menu + options | PK(menu,digit) |
| T-DB-011 | guidances repo | upsert/delete | name PK |
| T-DB-012 | cdr repo | upsert uniqueid | update 可能 |
| T-DB-013 | cdr_ingest_state | save offset | offset 単調 |
| T-DB-014 | cdr_ingest_state | inode changed | reset/read policy |
| T-DB-015 | accounts repo | username unique | duplicate error |
| T-DB-016 | sessions repo | valid/expired token | Account/null |
| T-DB-017 | audit/login_history repo | insert/list | created desc |
| T-DB-018 | password_policies | bootstrap | id=1 |
| T-DB-019 | ip_allow_list | CRUD | cidr PK |
| T-DB-020 | billing_rates | CRUD | prefix unique |
| T-DB-021 | concurrency_snapshots | upsert max | minute PK |
| T-DB-022 | version_upgrades | CRUD | scheduled_at stored UTC |
| T-DB-023 | sip_trunks | CRUD | name unique |
| T-DB-024 | transaction failure | repository write | rollback |
| T-DB-025 | normalized schema snapshot | compare | approved snapshot |
| T-DB-026 | existing production-like db | open | destructive migration なし |

### T-INFRA — filesystem / AMI-independent infra

| ID | Given | When | Then |
|----|-------|------|------|
| T-INFRA-001 | content + safe name | writeTextAtomic | file exists |
| T-INFRA-002 | nested dir | writeTextAtomic | mkdir recursive |
| T-INFRA-003 | unsafe path | writeTextAtomic | error |
| T-INFRA-004 | signal dir | signalAsteriskReload | reload file/timestamp |
| T-INFRA-005 | PJSIP content | writePjsipFile | pjsip.d にだけ書く |
| T-INFRA-006 | extensions render | writePjsipFile | golden と一致 |
| T-INFRA-007 | ringgroup dialplan | writeDialplanFile | golden と一致 |
| T-INFRA-008 | pickup dialplan | writeDialplanFile | golden と一致 |
| T-INFRA-009 | ivr dialplan | writeDialplanFile | golden と一致 |
| T-INFRA-010 | trunk configs | write files | pjsip/dialplan 両方 |
| T-INFRA-011 | business-hours | writeDialplanFile | golden と一致 |
| T-INFRA-012 | guidance wav | saveGuidanceWav | SOUNDS_DIR/name.wav |
| T-INFRA-013 | recording file | openRecordingStream | traversal 拒否 |
| T-INFRA-014 | inbox meta | validateInboxMeta | required keys |

### T-AMI / T-CDR-ING / T-CONC

| ID | Given | When | Then |
|----|-------|------|------|
| T-AMI-001 | DeviceStateChange | parseAmiEvent | extension/state 抽出 |
| T-AMI-002 | multi-line AMI | parse | complete event |
| T-AMI-003 | disconnect | reconnect loop | backoff |
| T-AMI-004 | current map | getDevices | snapshot |
| T-AMI-005 | originate success | originate | success result |
| T-AMI-006 | originate error/timeout | originate | typed error |
| T-CDR-ING-001 | new CSV line | ingest | cdr_records insert |
| T-CDR-ING-002 | same uniqueid | ingest | update |
| T-CDR-ING-003 | saved offset | ingest | only new bytes |
| T-CDR-ING-004 | inode changed | ingest | re-read policy |
| T-CDR-ING-005 | partial line | ingest | 次回へ持ち越し |
| T-CDR-ING-006 | malformed line | ingest | skip + error count |
| T-CONC-001 | same minute 30 then 50 | snapshot | DB MAX=50 |
| T-CONC-002 | lower value later | snapshot | max 維持 |
| T-CONC-003 | AMI channels | count | active channels |
| T-CONC-004 | empty channels | count | 0 |

### T-MW / T-API — Web contract

| ID | Given | When | Then |
|----|-------|------|------|
| T-MW-001 | 未ログイン page | GET protected page | `/login` redirect |
| T-MW-002 | 未ログイン API | GET protected API | 401 JSON |
| T-MW-003 | public login | GET `/login` | pass |
| T-MW-004 | fake cookie | handler requireAccount | 401 |
| T-MW-005 | IP deny | request | 403 |
| T-MW-006 | insufficient role | request/action | 403 or flash error |
| T-API-001 | supervisor | POST `/api/cdr/ingest` | 200 + inserted count |
| T-API-002 | user | POST `/api/cdr/ingest` | 403 |
| T-API-003 | user | GET `/api/devices/stream` | text/event-stream |
| T-API-004 | stream start | GET SSE | initial event |
| T-API-005 | user | GET `/api/extensions` | secret masked |
| T-API-006 | admin | GET `/api/extensions` | secret visible or admin view |
| T-API-007 | user | POST `/api/extensions` | create + reload |
| T-API-008 | invalid extension | POST `/api/extensions` | 400 |
| T-API-009 | user | POST `/api/originate` | AMI originate + audit |
| T-API-010 | invalid from/to | POST `/api/originate` | 400 |
| T-API-011 | 未ログイン | POST `/api/originate` | 401 |
| T-API-012 | phonebook hit | GET lookup | entry |
| T-API-013 | multipart wav | POST guidances | saved |
| T-API-014 | non wav | POST guidances | 400 |
| T-API-015 | recording file | GET recordings | stream |
| T-API-016 | traversal | GET recordings | 400/404 |
| T-API-017 | health enabled | GET `/api/health` | 200 |
| T-API-018 | unknown method | route | 405 or framework default |

### T-ACT — Server Actions（40 本）

| ID | Action | Then |
|----|--------|------|
| T-ACT-001 | createExtensionAction | user+ success + audit + PJSIP reload |
| T-ACT-002 | updateExtensionAction | user+ success + audit + PJSIP reload |
| T-ACT-003 | deleteExtensionAction | user+ success + audit + PJSIP reload |
| T-ACT-004 | createRingGroupAction | user+ success + audit + dialplan reload |
| T-ACT-005 | updateRingGroupAction | user+ success + audit + dialplan reload |
| T-ACT-006 | deleteRingGroupAction | user+ success + audit + dialplan reload |
| T-ACT-007 | createPickupGroupAction | user+ success + audit + pickup/PJSIP reload |
| T-ACT-008 | updatePickupGroupAction | user+ success + audit + pickup/PJSIP reload |
| T-ACT-009 | deletePickupGroupAction | user+ success + audit + pickup/PJSIP reload |
| T-ACT-010 | createPhonebookAction | user+ success + audit |
| T-ACT-011 | updatePhonebookAction | user+ success + audit |
| T-ACT-012 | deletePhonebookAction | user+ success + audit |
| T-ACT-013 | upsertHolidayAction | user+ success + audit + business-hours reload |
| T-ACT-014 | deleteHolidayAction | user+ success + audit + business-hours reload |
| T-ACT-015 | createTimeRuleAction | user+ success + audit + business-hours reload |
| T-ACT-016 | updateTimeRuleAction | user+ success + audit + business-hours reload |
| T-ACT-017 | deleteTimeRuleAction | user+ success + audit + business-hours reload |
| T-ACT-018 | upsertIvrAction | user+ success + audit + ivr reload |
| T-ACT-019 | deleteIvrAction | user+ success + audit + ivr reload |
| T-ACT-020 | deleteGuidanceAction | user+ success + audit |
| T-ACT-021 | loginAction | success cookie + login_history success |
| T-ACT-022 | logoutAction | session destroyed + audit |
| T-ACT-023 | setupTotpAction | self only + secret stored |
| T-ACT-024 | disableTotpAction | self only + secret cleared |
| T-ACT-025 | updateMyDisplayNameAction | self only + audit |
| T-ACT-026 | updateMyPasswordAction | policy enforced + audit |
| T-ACT-027 | createAccountAction | admin only + audit |
| T-ACT-028 | updateAccountRoleAction | admin only + last admin guard |
| T-ACT-029 | updateAccountDisplayNameAction | admin only + audit |
| T-ACT-030 | updateAccountPasswordAction | admin only + policy |
| T-ACT-031 | deleteAccountAction | admin only + last admin guard |
| T-ACT-032 | updatePolicyAction | admin only + audit |
| T-ACT-033 | upsertIpAllowAction | admin only + CIDR validate |
| T-ACT-034 | deleteIpAllowAction | admin only + audit |
| T-ACT-035 | upsertRateAction | supervisor+ + audit |
| T-ACT-036 | deleteRateAction | supervisor+ + audit |
| T-ACT-037 | upsertTrunkAction | admin only + PJSIP/dialplan reload |
| T-ACT-038 | deleteTrunkAction | admin only + PJSIP/dialplan reload |
| T-ACT-039 | scheduleUpgradeAction | admin only + audit |
| T-ACT-040 | deleteUpgradeAction | admin only + audit |

### T-UI / T-E2E

| ID | Given | When | Then |
|----|-------|------|------|
| T-UI-001 | logged in | `/` | summary counts |
| T-UI-002 | login error | `/login` | flash |
| T-UI-003 | extensions | `/extensions` | list/create/update/delete controls |
| T-UI-004 | devices | `/devices` | SSE status list |
| T-UI-005 | ring groups | `/ring-groups` | members editor |
| T-UI-006 | pickup groups | `/pickup-groups` | members editor |
| T-UI-007 | phonebook | `/phonebook` | search/list |
| T-UI-008 | business hours | `/business-hours` | holidays/time rules |
| T-UI-009 | IVR | `/ivr` | options editor |
| T-UI-010 | guidances | `/guidances` | upload/list/delete |
| T-UI-011 | CDR | `/cdr` | filters/table |
| T-UI-012 | recordings | `/recordings` | playable list |
| T-UI-013 | concurrency | `/concurrency` | graph/table |
| T-UI-014 | softphone | `/softphone` | SIP controls |
| T-UI-015 | billing | `/billing` | supervisor+ only |
| T-UI-016 | audit | `/audit` | supervisor+ only |
| T-UI-017 | accounts | `/accounts` | admin only |
| T-UI-018 | security | `/security` | admin only |
| T-UI-019 | trunks | `/trunks` | admin only |
| T-UI-020 | upgrades | `/upgrades` | admin only |
| T-UI-021 | me | `/me` | self profile + 2FA |
| T-E2E-001 | fresh app | login | `/` redirect |
| T-E2E-002 | logged in | extensions page | seed extension visible |
| T-E2E-003 | create extension | submit | PJSIP file regenerated |
| T-E2E-004 | docker up | `/login` | 200 |

### T-AST / T-DOCKER / T-INBOX

| ID | Given | When | Then |
|----|-------|------|------|
| T-AST-CONFIG-001 | minimal conf | asterisk config check | parse succeeds |
| T-AST-001 | `extensions.conf` | inspect | `_100X` MixMonitor |
| T-AST-002 | `extensions.conf` | inspect | 9001/9002 Record |
| T-AST-003 | reload signal | entrypoint watcher | pjsip+dialplan reload called |
| T-AST-004 | 9000 static IVR | inspect | 1/2/0 branches |
| T-AST-005 | include dynamic | inspect | `dialplan.d/*.conf` included |
| T-AST-006 | manager.conf | inspect | AMI user + permit |
| T-AST-007 | http.conf | inspect | websocket/http enabled |
| T-AST-008 | rtp.conf | inspect | RTP range matches compose |
| T-DOCKER-001 | compose | config | services asterisk + web |
| T-DOCKER-002 | compose | config | ports 5060/10000-10020/8088/8089/3000 |
| T-DOCKER-003 | compose volumes | config | §10 volume mapping と一致 |
| T-DOCKER-004 | web env | config | required env present |
| T-DOCKER-005 | asterisk env | config | INBOX_DIR and optional WEB_API_BASE_URL policy |
| T-DOCKER-006 | build context | config | expected Dockerfiles |
| T-INBOX-001 | notify-event args | run script | meta.json created |
| T-INBOX-002 | wav exists | run script | wav copied atomically |
| T-INBOX-003 | wav missing | run script | meta still created |
| T-INBOX-004 | Japanese callerName | run script | valid JSON escaping |
| T-INBOX-005 | kind 9001 | run script | `same_day_reservation` fields |
| T-INBOX-006 | kind 9002 | run script | `callback_request` fields |

### T-WEBRTC / T-CHROME / T-PROD / T-DOC

| ID | Given | When | Then |
|----|-------|------|------|
| T-WEBRTC-001 | WebRTC extension | render PJSIP | transport/webrtc options |
| T-WEBRTC-002 | softphone page | render | sip.js config present |
| T-WEBRTC-003 | no cert trusted | README | mkcert/trust steps exist |
| T-WEBRTC-004 | register failure | UI | error state |
| T-WEBRTC-005 | call controls | UI | dial/hangup/mute states |
| T-CHROME-001 | options page | save API URL | storage updated |
| T-CHROME-002 | tel link | click | originate fetch |
| T-CHROME-003 | missing config | click | user-visible error |
| T-CHROME-004 | manifest | validate | MV3 permissions minimal |
| T-PROD-001 | default admin password | prod check | fail |
| T-PROD-002 | default AMI secret | prod check | fail |
| T-PROD-003 | fixed Server Action key | prod check | fail/warn configured as fail |
| T-PROD-004 | cookie secure=false in prod | prod check | fail |
| T-PROD-005 | default extension secrets | prod check | fail |
| T-PROD-006 | AMI permit too broad | prod check | fail |
| T-PROD-007 | missing IP allow policy in prod | prod check | fail or explicit accept |
| T-PROD-008 | secrets changed | prod check | pass |
| T-PROD-009 | audit action enum | test | §2.5 と一致 |
| T-PROD-010 | README checklist | test | prod check items と一致 |
| T-DOC-001 | README quickstart | inspect | docker/login/call path |
| T-DOC-002 | README ports | inspect | compose と一致 |
| T-DOC-003 | README security | inspect | §11 と一致 |
| T-DOC-004 | host-tts docs | inspect | dev-only 明記 |

---

## 8. DB スキーマ・移行契約

### 8.1 互換方針

`apps/web/src/lib/db.ts` の `SCHEMA` は legacy spec として読む。ただし新実装では文字列のバイト同等を要求しない。以下を契約にする。

| 契約 | 検証 |
|------|------|
| 既存 table/column/index/FK を壊さない | `PRAGMA table_info`, `index_list`, `foreign_key_list` |
| 既存 DB を開ける | legacy fixture DB migration |
| 不足列の追加は冪等 | migration を 2 回実行 |
| seed が一貫 | extensions 1001/1002, password_policies id=1, bootstrap admin |
| destructive migration なし | fixture row count / primary keys を保持 |

### 8.2 テーブル一覧

| テーブル | 主キー | 備考 |
|----------|--------|------|
| extensions | number | webrtc INTEGER, secret |
| cdr_records | uniqueid | idx start/src/dst |
| cdr_ingest_state | id=1 CHECK | tail 状態 |
| ring_groups | id | number UNIQUE |
| ring_group_members | (ring_group_id, extension_number) | FK CASCADE |
| pickup_groups | id | name UNIQUE |
| pickup_group_members | composite PK | FK |
| phonebook | id | idx number/name |
| holidays | date | |
| time_rules | id | name UNIQUE |
| ivr_menus | id | number UNIQUE |
| ivr_options | (ivr_menu_id, digit) | |
| guidances | name | |
| accounts | id | username UNIQUE, totp_secret |
| sessions | token | FK account |
| audit_log | id | idx created |
| login_history | id | idx user+created |
| password_policies | id=1 | INSERT OR IGNORE |
| ip_allow_list | cidr | |
| billing_rates | id | prefix UNIQUE |
| concurrency_snapshots | minute_at | |
| version_upgrades | id | |
| sip_trunks | id | name UNIQUE |

### 8.3 Repository 契約

Repository は domain validation 済みの値を受け取る。ただし境界防衛として DB 層でも primary/unique/FK エラーを typed error に変換する。全 write API は transaction 境界を持つ。

---

## 9. Asterisk・Docker・ファイル契約

### 9.1 動的生成ファイル（Web -> volume）

| ファイル | 正本 renderer | writer |
|----------|---------------|--------|
| `pjsip.d/extensions.conf` | `@openpbx/core` PJSIP renderer | `@openpbx/infra` |
| `pjsip.d/trunks.conf` | `@openpbx/core` trunk PJSIP renderer | `@openpbx/infra` |
| `dialplan.d/ringgroups.conf` | `@openpbx/core` ring group renderer | `@openpbx/infra` |
| `dialplan.d/pickup.conf` | `@openpbx/core` pickup renderer | `@openpbx/infra` |
| `dialplan.d/ivr.conf` | `@openpbx/core` IVR renderer | `@openpbx/infra` |
| `dialplan.d/trunks.conf` | `@openpbx/core` trunk dialplan renderer | `@openpbx/infra` |
| `dialplan.d/business-hours.conf` | `@openpbx/core` business-hours renderer | `@openpbx/infra` |

### 9.2 静的 conf

`pjsip.conf`, `extensions.conf`, `manager.conf`, `cdr.conf`, `http.conf`, `rtp.conf`, `modules.conf`, `logger.conf`, `asterisk.conf` は runtime template として維持する。Phase 2.5 で早期に Asterisk config smoke を通す。

### 9.3 inbox meta.json スキーマ

```json
{
  "schema": "command-room-pbx/v1",
  "source": "asterisk",
  "kind": "same_day_reservation",
  "extension": "9001",
  "callerId": "1001",
  "callerName": "Reception",
  "uniqueId": "1700000000.1",
  "recordingFile": "1700000000.1-9001-1001.wav",
  "receivedAt": "2026-05-19T00:00:00Z"
}
```

`kind` は `same_day_reservation` または `callback_request` のみ。`recordingFile` は basename のみで、absolute path を入れない。

---

## 10. 環境変数・ボリューム契約

### 10.1 環境変数

| 変数 | 用途 | テストでの扱い |
|------|------|----------------|
| DATABASE_PATH | SQLite パス | temp file |
| PJSIP_OUT_DIR | 内線・trunk conf | temp dir |
| DIALPLAN_OUT_DIR | dialplan.d | temp dir |
| ASTERISK_SIGNAL_DIR | reload signal | temp dir |
| AMI_HOST | AMI host | mock |
| AMI_PORT | AMI port | mock |
| AMI_USERNAME | AMI user | mock |
| AMI_SECRET | AMI secret | mock + prod check |
| CDR_CSV_PATH | Master.csv | fixture file |
| RECORDINGS_DIR | 録音 | temp dir |
| INBOX_DIR | meta + wav | temp dir |
| SOUNDS_DIR | ガイダンス | temp dir |
| NEXT_SERVER_ACTIONS_ENCRYPTION_KEY | Server Actions | test fixed key + prod check |
| WEB_API_BASE_URL | legacy/comment compatibility | optional。notify-event は inbox 投下を正とする |

### 10.2 Compose volume mapping

| Host | Container | Owner |
|------|-----------|-------|
| `./data/db` | `/app/data/db` | web |
| `./data/inbox` | `/app/data/inbox:ro`, `/inbox` | web read, asterisk write |
| `./data/recordings` | `/app/data/recordings:ro`, `/var/spool/asterisk/monitor` | asterisk write |
| `./data/asterisk-cdr` | `/app/data/asterisk-cdr:ro`, `/var/log/asterisk/cdr-csv` | asterisk write |
| `./asterisk/sounds` | `/sounds` | web write for guidance |
| `./asterisk/pjsip.d` | `/asterisk/pjsip.d`, `/etc/asterisk/pjsip.d` | web write, asterisk read |
| `./asterisk/dialplan.d` | `/asterisk/dialplan.d`, `/etc/asterisk/dialplan.d` | web write, asterisk read |
| `./data/signals` | `/asterisk/signals`, `/signals` | web signal, asterisk watch |

---

## 11. 本番化・セキュリティ契約

### 11.1 デフォルト秘密検知

| 秘密 | デフォルト値 | 検知テスト |
|------|--------------|------------|
| admin password | `admin-please-change` | T-PROD-001 |
| extension secrets | `secret-1001`, `secret-1002` | T-PROD-005 |
| AMI secret | `command-room-ami-secret` | T-PROD-002 |
| Server Action key | repository fixed value | T-PROD-003 |
| cookie secure | `false` in production | T-PROD-004 |
| AMI permit | broad Docker range | T-PROD-006 |

### 11.2 認可の原則

| 境界 | 必須 |
|------|------|
| middleware | 未ログインの page/API を止める |
| Route Handler | `requireAccount` と role check を handler 内でも実施 |
| Server Action | action 内で `requireAccount` / `requireRole` を実施 |
| API response | user/supervisor に secret を返さない |
| audit | §2.5 の監査 action 名を enum として固定 |

Cookie の存在だけで保護されたものとして扱わない。middleware は UX と一次防衛、handler/action は権限の正本。

---

## 12. CI と進捗管理

### 12.1 ゲート

| Phase | コマンド |
|-------|----------|
| 0〜2 | `npm run test -w @openpbx/core` |
| 3 以降 | `npm run test -w @openpbx/db` |
| 4 以降 | `npm run test -w @openpbx/infra` |
| 6 以降 | `npm run test -w command-room-web` |
| 7 以降 | `npx playwright test e2e/smoke.spec.ts` |
| 8 以降 | `docker compose config` + Asterisk config smoke |
| all | `npm run test:gate` |

Root `test:gate` は phase が進むごとに対象を増やす。未作成 workspace を参照して gate を赤くする場合は、その phase の Red として扱い、同 PR で Green にする。

### 12.2 進捗状態

| 状態 | 意味 |
|------|------|
| todo | ID はあるがテスト未作成 |
| red | テストあり・失敗 |
| green | テスト通過 |
| wired | `apps/web` が正本 package を import 済み |
| manual-only | 自動化不能な手動確認。理由と手順が README にある |

**指標**: `green + wired` / §7 の全 ID 数。`it.todo` の件数だけを進捗指標にしない。

### 12.3 `roadmap.test.ts` の扱い

既存 `packages/pbx-core/src/__tests__/roadmap.test.ts` は一時的なメモであり、§7 の ID 付きテストへ置換する。置換後は以下を守る。

- `it.todo` には必ず `T-XXX-000:` を先頭に付ける
- §7 に存在しない ID を追加しない
- Phase 3 以降の todo は該当 package に移す

---

## 13. Codex / 実装者への引き渡し

### 13.1 作業開始前チェックリスト

- [ ] §1 のスコープと互換性優先順位を読む
- [ ] §2.7 の棚卸しを実行し、本書との差分を先に直す
- [ ] §6 で対象機能の Domain/DB/Infra/API/UI を確認する
- [ ] §7 から未 Green の ID を 1 つ選ぶ
- [ ] §2.2 の legacy spec を読む
- [ ] Red -> Green -> Refactor -> Wire の順で進める

### 13.2 禁止事項

- DB スキーマ文字列のバイト同等を目的にしない
- `apps/web/src/lib/*` に domain logic を新規追加したまま完了にしない
- Route Handler を middleware の cookie 存在チェックだけに依存させない
- Server Action の認可・監査・reload 契約を frontend 実装者に変更させない
- `it.todo` を ID なしで追加しない
- §7 にない ID を ad hoc に作らない
- デフォルト秘密を残したまま T-PROD を skip しない
- Phase 8 まで Asterisk config smoke を先送りしない

### 13.3 推奨ブランチ戦略

`rebuild/phase-N-short-name`。1 PR は 1 phase または 1 vertical slice（例: F01 内線 CRUD の Domain+DB+Infra+API+UI）に収める。

### 13.4 推奨実装順

1. Phase 0 棚卸しと package/workspace 整備
2. Phase 1〜2 domain 契約
3. Phase 2.5 早期 Asterisk smoke
4. Phase 3 DB
5. Phase 4〜5 infra/AMI/CDR
6. Phase 6 API/middleware
7. Phase 6.5 Server Actions TDD
8. Phase 7 frontend implementation / UI contract
9. Phase 8 runtime 通話・録音 smoke
10. Phase 9〜10 周辺・本番化

### 13.5 Claude フロント実装との接続ルール

Claude などのフロント実装者に渡してよいもの:

- `docs/FRONTEND-PLAN.md`
- Action 名と FormData key
- API request/response 型
- role matrix
- mock data / fixture
- Playwright smoke の実行結果

Claude などのフロント実装者に変更させないもの:

- `@openpbx/core` の validation 契約
- `@openpbx/db` schema / repository
- `@openpbx/infra` file/AMI 実装
- Route Handler の認可
- Server Action の認可・監査・reload
- prod checker
- golden master fixture

フロント側から backend contract 変更依頼が来た時は、次の順で処理する。

1. 既存 contract で UI 側が吸収できるか確認
2. 吸収できない場合、backend contract の変更理由を書く
3. 先に TDD test を追加して Red にする
4. backend を Green にする
5. `FRONTEND-PLAN.md` を更新する

Claude は Phase 0 の inventory と §2.3/§2.5 が確定した後に開始する。Claude が先行して画面を作る場合も、Action 名、FormData key、API URL、response JSON shape、role matrix、flash query key は stub contract として固定する。

### 13.6 PR 完了条件

TDD 対象の PR は以下を満たす。

- 対象 ID が Red から Green になっている
- coverage gate を下回らない
- golden master 差分がある場合は理由が書かれている
- `apps/web/src/lib/*` に domain logic を増やしていない
- 認可を UI だけに逃がしていない
- new env var は §10 と inventory に追加済み
- README 影響がある場合は docs test も更新済み

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-05-19 | 初版: 全機能マトリクス・テストカタログ ID・Codex 引き渡し |
| 2026-05-19 | 改訂: 0から再構築の定義、DB互換方針、Action 40本、認可マトリクス、全ID明示、golden master、早期Asterisk smoke、workspace名を修正 |
| 2026-05-19 | 改訂: `TDD-NON-FRONTEND-PLAN.md` の内容を統合。TDD必須範囲、coverage gate、Phase 6.5、Claude連携、PR完了条件を追加 |
