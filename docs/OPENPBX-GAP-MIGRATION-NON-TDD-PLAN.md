# OpenPBX 差分移植 — 非 TDD 作業計画

**目的**: `docs/OPENPBX-GAP-MIGRATION-TDD-PLAN.md`（codex 作成）が扱う Red→Green の Test ID 群とは別に、移植を完成させるための **設定・依存・テンプレ・docs・gate・運用** を一本化する。  
**対象**: ブラウザソフトフォン / `/network` / `/triage` / `/patients` / Chrome 拡張 を denwa に取り込む全工程のうち、テストでは保証できない作業。  
**読み方**: Phase 番号は TDD plan §11 と揃える。各 Phase の TDD 側 Red を立てる前に「事前」、Green 達成後に「事後」をやる。

---

## 0. 事前判断（実装前に答えを固定する）

TDD 計画には書けないが Red 1 本目より前に決め切る項目。各回答は本書 §13 に固定する。

| # | 決定事項 | 既定案 | 影響 |
|---|----------|--------|------|
| D1 | `sip.js` の取り込み方 | npm 依存 + バンドル（CDN 動的 script を禁止） | `apps/web/package.json`, `check:static`, CSP |
| D2 | softphone secret の開示範囲 | 「自分に割当てられた WebRTC 内線のみ」（accounts ↔ extensions の grant 必須） | `pbx-db` repo, `auth`, audit |
| D3 | Click-to-call の認証方式 | bearer token（hash 保存）/ cookie 流用は禁止 | 新 schema `click_to_call_tokens`, `/api/originate` |
| D4 | `/triage` の権限 | account+（user 可）。ただし患者紐付け保存は記録残し | `requireAccount`, audit kind |
| D5 | 患者データ保持期間・暗号化 | 平文保存 + 監査必須。**個人情報を含む旨**を README/SECURITY-MAP に明示 | docs |
| D6 | Tailscale IP の保存 | DB 平文（`network_settings`）。WAN グローバル IP は `prod-check` で warn | `network` repo, prod-check |
| D7 | 問診サマリの表現 | 「受付補助・問診メモ」と明記し**診断確定表現を避ける** | UI 文言、README |
| D8 | Chrome 拡張の配布 | unpacked / developer mode の手動配布のみ。Web Store には出さない | docs, manifest version |
| D9 | OpenPBX clone 位置 | 隣接パス `../OpenPBX`（README に明記） | inventory script, fixtures |

> 反対案を採るなら本書を更新してから TDD Red を立てる。

---

## 1. 環境セットアップ（一回だけ）

| 作業 | コマンド / 手順 | 確認方法 |
|------|----------------|----------|
| OpenPBX clone | `git clone https://github.com/tanimurahifukka/OpenPBX ../OpenPBX` | `ls ../OpenPBX/apps/web/src/lib/network.ts` |
| mkcert 導入 | `brew install mkcert nss && mkcert -install` | `mkcert -CAROOT` |
| Asterisk WSS 証明書 | `mkcert -cert-file asterisk/certs/asterisk.pem -key-file asterisk/certs/asterisk.key localhost 127.0.0.1 host.docker.internal $(hostname -s)` | `ls asterisk/certs/asterisk.pem` |
| Chrome / Edge dev mode | `chrome://extensions` → デベロッパーモード ON | Phase 5 完了後に `chrome-extension/` を読み込む |
| Tailscale（任意） | `brew install --cask tailscale` → ログイン → `tailscale ip -4` | 100.x.x.x の IP を取得 |

**追記**: `asterisk/certs/.gitignore` に `*.pem` / `*.key` を入れて誤コミットを防ぐ（既存 README はあるが gitignore は未確認 → 要追加）。

---

## 2. 依存追加 / lock 更新

| Phase | 追加対象 | 場所 | 備考 |
|-------|----------|------|------|
| 4 (softphone) | `sip.js@^0.21` | `apps/web/package.json` dependencies | CDN を捨てる代わり。`npm i sip.js` 後 `package-lock.json` をコミット |
| 4 | `@types/dom-mediacapture-record`（必要なら） | devDependencies | TS でメディア API を触る場合 |
| 5 (chrome) | なし（拡張側は素の JS） | — | 拡張は npm に依存しない |
| 全般 | `npm audit` で増分確認 | `scripts/sca-audit.mjs` | high 以上が出たら pin 更新 |

事後に `npm run harness` で `test:gate` + `sca` が green を確認。

---

## 3. DB schema / migration（TDD では書かない接続作業）

`packages/pbx-db/src/schema-sql.ts` を一次正本として、TDD plan で要るが現状未整備のテーブルを追記する。

| テーブル | 既存 | 追加内容 |
|----------|------|----------|
| `patients` | ✅ あり（§schema-sql 215） | 変更なし。golden で確認 |
| `patient_records` | ✅ あり | `kind` 制約に `triage / call / note` を維持 |
| `network_settings` | ✅ あり（id=1 seed 済み） | 変更なし |
| `click_to_call_tokens` | ❌ なし | **新規**: `id`, `account_id`, `name`, `hash`, `from_extension`, `created_at`, `revoked_at` |
| `account_extension_grants` | ❌ なし（D2 採用時） | **新規**: `account_id`, `extension_number`, `granted_at` |

事後作業:
1. `packages/pbx-db/src/repos/` 配下に対応 repo を追加（TDD で書く）
2. `packages/pbx-db/fixtures/schema-normalized.json` を再生成（`scripts/` で sync があるはず）
3. 既存 sqlite が壊れないよう `CREATE TABLE IF NOT EXISTS` を維持
4. dev 環境の `data/db/command-room.sqlite` は `npx tsx scripts/bootstrap-dev-admin.ts` で再作成

---

## 4. Asterisk テンプレ / コンテナ運用

### 4.1 `/network` 反映先

`asterisk/pjsip.d/transports.conf` は **静的種** で残し、Web 保存時に `@openpbx/infra` が `data/pbx-out/pjsip.d/transports.conf` を上書きする方針（既存 `extensions.conf` 同形）。

| 作業 | 内容 |
|------|------|
| renderer | `packages/pbx-infra/src/pjsip/render-transports.ts` を追加（pure → TDD 側） |
| 出力先 | `data/pbx-out/pjsip.d/transports.conf` |
| reload | `data/signals/asterisk-reload`（既存 signal pipeline 再利用） |
| compose 変更 | 不要（`./data/pbx-out/pjsip.d:/etc/asterisk/pjsip.d` は既存マウント済み） |

### 4.2 WSS 8089 公開

| 現状 | 変更案 |
|------|--------|
| compose で 8089 はホスト非公開（`T-SEC-A05-001`） | **ブラウザソフトフォンは同一ホスト想定**で 8089 は引き続き非公開。`/softphone` は WSS を `wss://<host>:8089` ではなく **`wss://<web 経由のリバプロ>`** に向ける選択肢を Phase 4 で再検討する |
| 代替: dev 限定で 8089 公開（`docker-compose.override.yml`） | `.gitignore` 済みファイルで dev のみ port 公開し、prod overlay では絶対公開しない |

> ここは prod-check / SECURITY-MAP 側の方針と整合させるため D2/D6 と同時に決める。Phase 4 開始前に答えを §13 に追記。

### 4.3 cert ローテーション

mkcert は dev 用。本番は ACME or 持ち込み証明書。`asterisk/certs/README.md` に prod 手順を追記する（cert 期限監視は別計画）。

---

## 5. ナビ / レイアウト / 既存 UI 接続

| ファイル | 変更 | Phase |
|----------|------|-------|
| `apps/web/src/components/NavBar.tsx` | `/triage`, `/patients`, `/network` を追加。`/network` は admin のみ、`/triage`・`/patients` は account+ | 各 Phase で追加（UI 完成と同時） |
| `apps/web/src/app/softphone/page.tsx` | placeholder を Phase 4 で本実装に差し替え | Phase 4 |
| `apps/web/src/app/layout.tsx` | 患者ヘッダ / 問診タブの位置決め（OpenPBX レイアウトを参照） | Phase 3 |
| `apps/web/src/lib/auth.ts` | `requireRole('admin')` などは既存。grant 系（D2）は新 helper を追加 | Phase 4 |

> 既に main に未コミット `M apps/web/src/app/actions.ts` がある（`'use server'` 削除 + コメント追記）。**TDD 移植開始前にコミット or revert** すること。混ぜると差分追跡が困難。

---

## 6. 静的 gate / prod-check の文字列追加

実装は TDD 側で test を増やすが、**パターン文字列の追加自体は手動編集** なのでここで一括する。

`scripts/check-denwa-static.mjs`
- `https://cdn.jsdelivr.net/npm/sip.js` の生 URL を fail（D1）
- `chrome-extension/manifest.json` の `permissions` allowlist（D8）
- `apps/web/src/lib/` に `patients|network|triage` 名の domain 関数を作らない（既存 SoC ルール拡張）

`scripts/prod-check.ts`
- `click_to_call_tokens` が空 = warn（D3）
- `network_settings.external_ip` が WAN グローバル IP（100.x / RFC1918 以外）= warn（D6）
- `asterisk/certs/asterisk.pem` placeholder のままで `enabled=yes` なら fail

`scripts/sca-audit.mjs`
- `sip.js` の既知 CVE allowlist 文字列だけ管理（脆弱性が出たら手で更新）

---

## 7. README / docs / runbook 文章更新

| ファイル | 追記内容 |
|----------|---------|
| `README.md` | Tailscale / NAT 設定、WebRTC cert 手順、Chrome 拡張 unpacked 配布、`/patients` `/triage` の医療的位置付け免責 |
| `docs/SECURITY-MAP.md` | D2/D3/D6 の policy 表 |
| `docs/runbook-security.md` | softphone secret 漏えい時、click2call token 漏えい時、network 設定の誤入力時の oncall 手順 |
| `docs/PENTEST-NEXT-SCOPE.md` | softphone / chrome / patient の新 attack surface |
| `docs/LEGACY.md` | OpenPBX から **持ち込まない** 挙動の一覧（TDD plan §14 と同型） |

すべて TDD plan §10（Phase 6）の Test で fail させた状態から書き起こす。

---

## 8. Chrome 拡張のリポ配置 / 配布

| 作業 | 内容 |
|------|------|
| ディレクトリ | `chrome-extension/`（リポ直下、OpenPBX と同形） |
| ファイル | `manifest.json` (MV3) / `background.js` / `content.js` / `options.html` / `options.js` / `icons/*.png` |
| アイコン | 16/48/128 PNG（OpenPBX に無いので新規） |
| 配布 | `chrome://extensions` → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」で `chrome-extension/` を指定 |
| 管理画面側 | `/me`（or `/accounts/[id]/tokens`）で token を発行・失効する UI を追加（TDD: T-CHX-011/012） |
| token 既定 | `prod-check` で 0 件のままを warn し、漏えい時は revoke + 再発行 |

---

## 9. fixtures / golden master の物理配置

TDD plan §4 で `fixtures/golden/current/openpbx-gap/*` を作る。手作業の側面:

| 作業 | 内容 |
|------|------|
| 元データ採取 | OpenPBX を実際に起動して `/network`, `/patients`, `/triage`, `tel:` 正規化の **代表入出力** を採取 |
| 命名 | `network.input.json` / `network.expected.json` / `patient.example.json` / `triage.path.json` / `tel.samples.json` |
| 場所 | `fixtures/golden/current/openpbx-gap/` |
| 更新ルール | golden は手動更新のみ。コードから書き直さない（既存 fixtures 方針と同じ） |

`scripts/inventory-openpbx-gap.mjs`（TDD plan §4）が依存するパスはここに固定する。

---

## 10. ブランチ / PR / コミット運用

直近の main 履歴は `TDD7` / `TDD6` のような短いトピックブランチを Merge PR で取り込む流れ。本移植も同じ運用にする。

| PR | branch 名（提案） | 主タスク |
|----|--------------------|---------|
| PR-1 | `GAP-0-inventory` | inventory script + fixtures + scaffold docs |
| PR-2 | `GAP-1-network` | `/network` 一式 |
| PR-3 | `GAP-2-patients` | `/patients` 一式 |
| PR-4 | `GAP-3-triage` | `/triage` 一式 |
| PR-5 | `GAP-4-softphone` | `/softphone` + sip.js 依存 |
| PR-6 | `GAP-5-chrome` | `chrome-extension/` + token UI |
| PR-7 | `GAP-6-docs-gate` | README / SECURITY-MAP / static & prod gate |

各 PR のチェック:
- `npm run harness` green
- `docs/OPENPBX-GAP-MIGRATION-TDD-PLAN.md` の該当 §の test IDs が green
- 本書の該当 § の手動 smoke が通る
- prod-check に regression なし

> ブランチ作業前に**現 main の未コミット `actions.ts`** を処理（§5 参照）。

---

## 11. 手動 smoke チェックリスト

TDD plan §13 を分解し、操作手順まで落としたもの。

### 11.1 `/network`
1. `npx tsx scripts/bootstrap-dev-admin.ts`
2. `cd apps/web && DATABASE_PATH=../../data/db/command-room.sqlite npm run dev`
3. `/network` を admin で開き、Tailscale IP `100.x.x.x` を保存
4. `cat data/pbx-out/pjsip.d/transports.conf` で `external_media_address` / `external_signaling_address` / `local_net` が反映
5. `ls data/signals/asterisk-reload` が更新
6. `docker compose up` 後 `docker compose exec asterisk asterisk -rx "pjsip show transports"` で値が一致

### 11.2 `/patients`
1. `/patients` で `12345` を作成、氏名 / ふりがな / 連絡先を保存
2. `/patients/12345` で record を `kind=note` で追加
3. 一覧の「最近の記録」に表示

### 11.3 `/triage`
1. `/triage?patient=12345&ext=1001` を開く
2. 主訴を選択し最終ノードまで進む
3. 「保存」で `kind=triage` の record が作成され、サマリ markdown が `summary` 欄に入る

### 11.4 `/softphone`
1. `/extensions` で `1001` を `webrtc=ON` に
2. `/me` でアカウントに `1001` を grant
3. mkcert で `asterisk/certs/asterisk.pem` を作成し `docker compose restart asterisk`
4. ブラウザで `https://localhost:8089/` を承認
5. `/softphone` で「登録」→ 状態が `registered` に
6. `1002` も同様に登録し、片方から発信 → 着信 → 応答 → 切断
7. `data/recordings/` に MixMonitor が出る（既存 dialplan に依存）

### 11.5 Chrome 拡張
1. `chrome://extensions` → unpacked で `chrome-extension/` をロード
2. 拡張オプションで `baseUrl=http://localhost:3000`, `from=1001`, `token=<発行 token>` を保存
3. 任意の Web ページの `tel:` リンクをクリック
4. `/audit` に `kind=originate / actor=click2call:<token name>` の log
5. 不正 token / 不正 from は 401 / 403 で fail

---

## 12. リスク / 例外

| リスク | 対応 |
|--------|------|
| OpenPBX 側が更新されて inventory が壊れる | 隣接 clone を `git -C ../OpenPBX rev-parse HEAD` で記録、本書に SHA を残す |
| sip.js が CSP に弾かれる | 自前バンドル + `script-src 'self'` を維持。worker 化が必要なら個別 PR |
| dev mkcert 証明書を誤って prod に持ち込む | `asterisk/certs/.gitignore` + `prod-check` で `localhost` SAN を fail |
| 患者データを誤って Slack/PR に貼る | golden fixture は架空データのみ。本物データは `data/` 配下に閉じる |
| Chrome 拡張 token がリポに混入 | `chrome-extension/options.js` は値を保存しないテンプレ。実値は `chrome.storage` のみ |

---

## 13. 決定ログ（D1〜D9 への回答を埋める）

| # | 決定 | 確定日 | 承認 |
|---|------|--------|------|
| D1 | sip.js: ☐ npm bundle / ☐ CDN with SRI / ☐ 他 | — | — |
| D2 | secret 開示: ☐ admin only / ☐ grant 必須 / ☐ 他 | — | — |
| D3 | click2call 認証: ☐ bearer token / ☐ session + same-origin helper | — | — |
| D4 | `/triage` 権限: ☐ account / ☐ supervisor / ☐ admin | — | — |
| D5 | 患者データ: ☐ 平文 + 監査 / ☐ at-rest 暗号化 | — | — |
| D6 | Tailscale IP 保存: ☐ DB 平文 / ☐ 環境変数 | — | — |
| D7 | 問診表現: ☐ 受付補助のみ / ☐ 他 | — | — |
| D8 | Chrome 配布: ☐ unpacked のみ / ☐ Web Store | — | — |
| D9 | OpenPBX clone: ☐ `../OpenPBX` / ☐ 他 | — | — |

> 表が埋まる前に Phase 1 の TDD Red を立てない。

---

## 14. 完了条件（本書スコープ）

1. §13 が全て埋まっている
2. §1 の環境セットアップが手元で完了している
3. §2 / §3 / §4 / §5 / §6 / §7 / §8 / §9 のうち TDD と紐づかない手作業が PR-1〜PR-7 のいずれかに含まれている
4. §11 の手動 smoke を一度通している
5. main に `M apps/web/src/app/actions.ts` のような未コミット差分が残っていない
