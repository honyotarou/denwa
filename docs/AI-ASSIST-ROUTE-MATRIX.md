# AI Assist — Route 介入マトリクス（denwa）

方針: **AI は middleware / 非同期 worker**。UI に「AI 職場感」を出さず、既存 HTTP 契約は維持する。

## 凡例

| 記号 | 意味 |
|------|------|
| 🚫 | **介入禁止** — 同期 LLM 不可。観測ログも最小（監査・秘密・副作用） |
| 👁 | **observe-only** — リクエスト/レスポンスを正規化イベント化してログ・キューへ（body 不変） |
| 📖 | **GET enrich 可** — 本体レスポンスは変えず、別 channel（ヘッダ / 並行 API / RSC prop）で補助情報 |
| ✋ | **POST 検査可** — 漏れ・矛盾・危険操作の**提案・警告のみ**。body 改変・自動保存禁止 |
| ⭐ | **Phase 1 パイロット** — observe → enrich の最初の対象 |

## 挿入ポイント（推奨）

```
Browser
  → middleware.ts          … セッション/IP/CSP（現状）+ 👁 assist.observe(path, role)
  → route / Server Action  … 既存 handler（契約不変）
  → assist-worker (async)  … 業務イベント → ルール/LLM → cache
  → UI                     … 控えめな badge / 1 行メモ（「AI」ラベルなし）
```

**外側リバプロ**は Phase 0 では **観測ミラー**のみ（denwa の CSRF / session は Next 内が正本）。

---

## REST API (`apps/web/src/app/api/**`)

| Route | Method | 最小 role | PII/秘密 | 副作用 | 判定 | Phase 1 メモ |
|-------|--------|-----------|----------|--------|------|----------------|
| `/api/health` | GET | 公開 | なし | なし | 🚫 | プローブ。触らない |
| `/api/devices/stream` | GET | supervisor | 端末状態 | SSE 長接続 | 🚫 / 👁 | 同期 enrich 不可。着信/状態変化の**イベント源**として observe のみ |
| `/api/cdr/export` | GET | supervisor | CDR 全件 | 大量 DL | 👁 | bulk PII。enrich より export 監視・異常検知 |
| `/api/cdr/ingest` | POST | supervisor | CDR | DB 書込 | 👁 | ingest 完了イベント → 裏分類のトリガー候補 |
| `/api/phonebook/lookup` | GET | user | 電話帳 | なし | 📖 / 👁 | 検索補完・表記ゆれ normalize は enrich 向き |
| `/api/recordings/[file]` | GET | supervisor | 音声 | ストリーム | 🚫 | バイナリ直 pass。メタはページ側で enrich |
| `/api/inbox/[file]` | GET | user | 音声+meta | ストリーム | 🚫 / 👁 | wav は不可。Inbox 一覧ページで enrich |
| `/api/extensions` | GET | user | secret※ | なし | 👁 | ※ role でマスク済。secret を assist に渡さない |
| `/api/extensions` | POST | supervisor | secret | PJSIP sync | 🚫 / ✋ | 書込禁止介入。危険番号の**警告**のみ将来可 |
| `/api/extensions/[number]` | GET | user | secret※ | なし | 👁 | 同上 |
| `/api/extensions/[number]` | PUT/DELETE | supervisor | secret | PJSIP sync | 🚫 | 設定変更。提案止まりも慎重（parity） |
| `/api/originate` | POST | user / Bearer | 発信先 | **発信** | 🚫 | CSRF/Bearer/AMI。assist 同期 path 厳禁 |
| `/api/guidances` | POST | supervisor | wav | FS + dialplan | 🚫 | ファイル upload。検査も非同期のみ |
| `/api/patients/records` | POST | user | **患者記録** | DB+audit | ⭐ ✋ 👁 | **第一号**: 保存前 validate（漏れ・矛盾）、observe → 非同期要約は別 job |

---

## ページ（SSR / RSC — 実質 GET）

| Path | 最小 role | 判定 | enrich 例（本体 HTML は不変） |
|------|-----------|------|--------------------------------|
| `/` | user | 📖 | 端末サマリ横に「未対応 Inbox N 件」 |
| `/login` | 公開 | 🚫 | |
| `/devices` | supervisor | 👁 | ライブ UI。補助は SSE イベント非同期 |
| `/cdr` | user | 📖 | 行 hover で補助（同一発信者の直近） |
| `/recordings` | supervisor | 📖 | uniqueid → 患者/問診リンク候補 |
| `/inbox` | user | ⭐ 📖 | kind/発信者の**控えめ badge**（分類は async） |
| `/concurrency` | user | 📖 | 異常ピークの注釈 |
| `/softphone` | user | ⭐ 📖 | 右カラム問診の**次に聞く項目**（既存 UI 内 1 行） |
| `/triage` | user | ⭐ 📖 ✋ | フロー進行ヒント；保存 Action 前 validate |
| `/patients` | user | ⭐ 📖 | 検索結果に「前回問診から N 日」 |
| `/patients/[id]` | user | ⭐ 📖 | 記録一覧上にサマリ chip（自動保存しない） |
| `/extensions` | user | 👁 | secret 画面。enrich しない |
| `/ring-groups` … `/ivr` | user | 👁 / ✋ | 設定画面。書込 Action は 🚫、将来 ✋ のみ |
| `/guidances` | user | 👁 | |
| `/audit` | supervisor | 🚫 | 監査そのものを AI が汚さない |
| `/billing` | supervisor | 🚫 | 金額・レート。誤提案リスク大 |
| `/network` `/trunks` `/accounts` `/security` `/upgrades` | admin | 🚫 | インフラ・認可。observe も最小 |
| `/me` | user | 🚫 | パスワード/TOTP/トークン |

---

## Server Actions (`apps/web/src/app/actions/**`)

Next Server Action は **POST（`Next-Action`）**。CSRF は Origin 門番 + セッション。

| Action 群 | 最小権限 | 判定 | 備考 |
|-----------|----------|------|------|
| `loginAction` / `logoutAction` | 公開/ session | 🚫 | 認証境界 |
| `setupTotpAction` / `disableTotpAction` / password 変更 | user | 🚫 | |
| `*Patient*Action` / `savePatientRecordAction` | user〜supervisor | ⭐ ✋ | triage 保存・API `/api/patients/records` と同契約 |
| `*Extension*` / ring / pickup / ivr / business-hours / guidance | supervisor | 🚫 / ✋ | PBX 設定書込（`PBX_CONFIG_WRITE_MIN_ROLE`） |
| `*Account*` / `*Trunk*` / network / security policy | admin | 🚫 | |
| `upsertRateAction` / billing | supervisor | 🚫 | |
| `ingestCdrAction` | supervisor | 👁 | |
| click-to-call token 発行 | user | 🚫 | originate 連鎖 |

---

## Phase 1 実装順（observe-only から）

1. **middleware 👁** — path + role + latency を `assist_events` に記録（body/response は保存しない、ハッシュのみ）
2. **イベント正規化** — `PatientRecordDraft` / `InboxRowSeen` / `TriageStepView`
3. **非同期 worker** — ルールベースのみ（LLM 前段）：「患者 ID 未設定」「kind=triage なのに summary 空」
4. **UI 差し込み** — `/inbox` badge、`/triage` + softphone 右カラムの 1 行ヒント（`assist` 専用 prop、OpenPBX parity 外の denwa 拡張として明示）
5. **✋ POST validate** — `/api/patients/records` + `savePatientRecordAction` の**警告 JSON**（422 + `warnings[]`、保存はユーザー再送）

## 触ってはいけない線（harness / pentest）

- `rejectDisallowedPostOrigin` より**前**で body を書き換えない（F-018）
- `audit` / session / extension **secret** を LLM context に入れない
- originate / extension POST / admin Action に**同期 LLM**を入れない
- 録音・Inbox **ストリーム**に inline 解析を載せない
- enrich は **OpenPBX parity API**（`/api/extensions` 等）の JSON shape を変えない → 別 header `X-Assist-*` または parallel `GET /api/assist/hints?...`

## 関連ファイル

- 門番: `apps/web/src/middleware.ts`, `apps/web/src/server/middleware-auth.ts`
- API 認可: `apps/web/src/server/api/with-auth.ts`
- Action 認可: `apps/web/src/server/actions/shared.ts`
- Nav role 契約: `apps/web/src/lib/nav-policy.ts` → `@openpbx/core/auth/pbx-api-policy`
- セキュリティ: `docs/PENTEST-NEXT-SCOPE.md`, `docs/SECURITY-MAP.md`
