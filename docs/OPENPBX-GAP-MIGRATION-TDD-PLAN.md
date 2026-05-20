# OpenPBX 差分機能の TDD 移植計画

**目的**: OpenPBX だけに実装済みで、denwa では未実装または弱い機能を、TDD で denwa の分離アーキテクチャへ移植する。  
**対象**: ブラウザソフトフォン、`/network`、問診フロー、患者管理、Chrome 拡張、関連 API / Action / docs / gate。  
**前提**: OpenPBX の実装は legacy spec として読む。denwa では `@openpbx/core`, `@openpbx/db`, `@openpbx/infra`, `apps/web` の責務分離を維持し、OpenPBX の `apps/web/src/lib/*` 集中構造へ戻さない。  
**注意**: OpenPBX の弱い既定 secret や cookie 前提の Chrome 拡張発信をそのまま移植しない。denwa の secret ローテーション、静的 gate、CSRF / Origin gate、prod check を優先する。

---

## 1. 現状差分

| 領域 | OpenPBX | denwa 現状 | 移植方針 |
|------|---------|------------|----------|
| ブラウザソフトフォン | `/softphone/softphone.tsx` が sip.js + WSS で登録/発信/応答 | `/softphone` は UI placeholder。PJSIP WebRTC テンプレートと `webrtc` flag は存在 | SIP クライアント状態機械と UI を TDD。secret 露出は権限/割当で制限 |
| `/network` | NAT / Tailscale 用 external address 設定 | `network_settings` schema は存在。repo/action/page/動的 transport 連携が不足 | strict validation、repo、transport renderer、admin UI、reload を TDD |
| `/triage` | 整形外科問診フロー UI + 患者記録保存 | なし | flow engine と summary builder を pure domain 化。UI と保存連携を別テスト |
| `/patients` | 患者 CRUD、記録 CRUD、問診保存先 | `patients` / `patient_records` schema は存在。repo/action/page/API が不足 | domain validation、DB repo、Action/API、ページを段階実装 |
| Chrome 拡張 | MV3 Click-to-call、tel link、選択番号発信 | なし。`/api/originate` は存在するが mocked | 拡張用の安全な認証契約を先に固定し、manifest/content/background を TDD |
| コード構成 | web 内 lib 集中 | packages 分離済み | OpenPBX の構造は移植しない。仕様と fixtures だけ抽出 |
| 既定 secret | README に `secret-1001` 等が残る | bootstrap / prod check / forbidden secrets あり | OpenPBX 互換より denwa gate を優先。回帰テストを追加 |
| セキュリティ gate | 手動中心 | harness / static gate / prod check / pentest tests | 新機能ごとに gate 対象を追加 |

---

## 2. 全体の完了条件

1. `npm run test:gate` が green。
2. `npm run check:static` と `npm run prod-check` が green。
3. 追加した全 test ID が green、または `manual-only` の理由が本書に追記済み。
4. `docker compose up` 後、以下の手動 smoke が通る。
   - admin で `/network` を保存すると `asterisk/pjsip.d/transports.conf` に反映され reload signal が出る。
   - WebRTC 有効な内線で `/softphone` の登録 UI が実行でき、失敗時は原因が表示される。
   - `/patients` で患者を作成し、`/triage?patient=xxxxx` の summary を patient record として保存できる。
   - Chrome 拡張から許可済み credential で `/api/originate` を呼べる。
5. 新機能で user / supervisor / admin の権限境界が崩れていない。
6. OpenPBX の不安全な挙動を取り込まない。
   - user が全 WebRTC 内線 secret を読めない。
   - Chrome 拡張が cookie + cross-origin POST だけで発信できない。
   - default extension secret / AMI secret / fixed action key が prod check を通らない。

---

## 3. TDD 進行ルール

| ルール | 内容 |
|--------|------|
| Red first | 実装前に該当 test ID を追加し、現在の denwa で fail することを確認する |
| package first | domain は `@openpbx/core`、永続化は `@openpbx/db`、fs/reload/AMI は `@openpbx/infra`、UI/API は `apps/web` |
| fixtures | OpenPBX から読み取った期待値は `fixtures/golden/current/openpbx-gap/*` に固定する |
| security before UI | secret、Origin、role、audit のテストを UI 完成前に通す |
| no broad copy | OpenPBX の大きな `lib/*` をそのまま `apps/web` に移植しない |
| refactor gate | Green 後に import boundary と static gate を通してから次 Phase へ進む |

---

## 4. Phase 0 - OpenPBX 差分 inventory / golden master

**目的**: 移植対象を固定し、後続実装が「OpenPBX で何ができたか」を見失わないようにする。

### 作業

1. `scripts/inventory-openpbx-gap.mjs` を追加し、隣接 clone `../OpenPBX` から以下を検出する。
   - `apps/web/src/app/softphone/softphone.tsx`
   - `apps/web/src/app/network/page.tsx`
   - `apps/web/src/lib/network.ts`
   - `apps/web/src/app/triage/*`
   - `apps/web/src/lib/patients.ts`
   - `apps/web/src/app/patients/**`
   - `apps/web/src/app/api/patients/records/route.ts`
   - `chrome-extension/*`
2. OpenPBX の expected behavior を golden 化する。
   - network input / output examples
   - patient / record examples
   - triage graph summary examples
   - Chrome tel normalization examples
   - softphone state transition examples
3. inventory 結果を `docs/OPENPBX-GAP-INVENTORY.md` に出力できるようにする。

### Tests

| ID | Given | When | Then |
|----|-------|------|------|
| T-GAP-INV-001 | `../OpenPBX` clone | inventory 実行 | 差分対象ファイルが全て検出される |
| T-GAP-INV-002 | OpenPBX missing | inventory 実行 | 明確な skip 理由で fail しない |
| T-GAP-INV-003 | generated inventory | compare | 本書 §1 の対象と一致する |
| T-GAP-GM-001 | OpenPBX network sample | normalize | expected JSON と一致 |
| T-GAP-GM-002 | OpenPBX patient sample | normalize | expected JSON と一致 |
| T-GAP-GM-003 | OpenPBX triage path | build summary | expected markdown と一致 |
| T-GAP-GM-004 | Chrome tel samples | normalize | expected numbers と一致 |

---

## 5. Phase 1 - `/network` NAT / Tailscale 設定

**目的**: Web UI から external media / signaling address と local_net を保存し、PJSIP transport に反映する。

### 責務分割

| 層 | 実装 |
|----|------|
| `@openpbx/core` | `NetworkSettingsDraft`、strict IPv4 / CIDR validation、transport extras renderer |
| `@openpbx/db` | `network_settings` repo: get/update/id=1 bootstrap |
| `@openpbx/infra` | `writePjsipTransportFile`、`signalAsteriskReload` 連携 |
| `apps/web` | `/network` page、`updateNetworkAction`、admin nav、audit `network.update` |

### 仕様

1. IPv4 は octet 0-255 で検証する。OpenPBX の単純 regex より厳密にする。
2. `externalSignalingIp` が空なら `externalIp` を fallback とする。
3. `localNet` はカンマ区切り CIDR を trim し、空要素を落とし、重複を削除して安定順序で保存する。
4. unsafe 文字列を PJSIP conf に出力しない。
5. 保存成功時は `pjsip.d/transports.conf` と reload signal を更新する。
6. `/network` は admin only。user / supervisor には nav も Action も許可しない。

### Tests

| ID | Given | When | Then |
|----|-------|------|------|
| T-NET-001 | `100.64.1.23` | validate IPv4 | ok |
| T-NET-002 | `999.1.1.1` | validate IPv4 | error |
| T-NET-003 | `100.64.0.0/10, 192.168.0.0/16` | normalize localNet | trim + stable list |
| T-NET-004 | `192.168.0.0/33` | validate CIDR | error |
| T-NET-005 | `externalIp` only | render transport extras | media + signaling fallback が出る |
| T-NET-006 | multiple local nets | render transport extras | `local_net=` が複数行出る |
| T-NET-007 | unsafe value | render | null / error で conf を出さない |
| T-NET-008 | empty db | apply schema | `network_settings` id=1 が存在 |
| T-NET-009 | repo update | get | 保存値が正規化される |
| T-NET-010 | update action admin | submit | repo update + transport write + reload + audit |
| T-NET-011 | update action user | submit | 403 / flash error、write なし |
| T-NET-012 | `/network` page admin | render | local IPv4 と form が見える |
| T-NET-013 | nav admin | render | `/network` link が見える |
| T-NET-014 | nav user | render | `/network` link が見えない |

---

## 6. Phase 2 - 患者管理 `/patients`

**目的**: 患者基本情報と通話/問診/メモ記録を管理し、問診フローと連携できる保存先を作る。

### 責務分割

| 層 | 実装 |
|----|------|
| `@openpbx/core` | patient id / birthDate / extension / record kind validation、record summary normalizer |
| `@openpbx/db` | `patients` / `patient_records` repo、search、cascade delete、recent records |
| `apps/web/server` | patient services、Action handlers、API handler `/api/patients/records` |
| `apps/web/app` | `/patients`、`/patients/[id]`、forms、ConfirmButton、NavBar |

### 仕様

1. patient id は 5 桁数字。
2. `birthDate` は `YYYY-MM-DD` のみ許可し、空は null。
3. record kind は `triage | call | note` のみ。
4. record 作成時、患者が存在しなければ空患者を自動作成できる。
5. patient delete は supervisor+ または admin。patient upsert / record create は user+。
6. record delete は supervisor+ または admin。
7. search は id / name / kana に対して最大 200 件。
8. patient detail は日付ごとに record を grouped 表示する。
9. 全 write で audit を残す。

### Tests

| ID | Given | When | Then |
|----|-------|------|------|
| T-PAT-001 | `12345` | validatePatientId | ok |
| T-PAT-002 | `1234` / `abcde` | validatePatientId | error |
| T-PAT-003 | `2026-05-20` | validateBirthDate | ok |
| T-PAT-004 | `2026/05/20` | validateBirthDate | error |
| T-PAT-005 | kind `triage` | validateRecordKind | ok |
| T-PAT-006 | kind `diagnosis` | validateRecordKind | error |
| T-PAT-007 | empty db | apply schema | patients tables + indexes exist |
| T-PAT-008 | upsert patient twice | repo get | updated fields、created_at preserved |
| T-PAT-009 | search by kana | repo list | matching rows only |
| T-PAT-010 | create record for missing patient | repo | patient auto-created |
| T-PAT-011 | delete patient | repo | records cascade delete |
| T-PAT-012 | recent records | repo | recorded_at desc |
| T-PAT-013 | user | upsertPatientAction | success + audit |
| T-PAT-014 | user | savePatientRecordAction | success + audit |
| T-PAT-015 | user | deletePatientAction | denied |
| T-PAT-016 | supervisor | deletePatientAction | success + audit |
| T-PAT-017 | unauthenticated | POST `/api/patients/records` | 401 |
| T-PAT-018 | invalid patientId | POST `/api/patients/records` | 400 |
| T-PAT-019 | valid JSON body | POST `/api/patients/records` | 201 + record |
| T-PAT-020 | valid FormData body | POST `/api/patients/records` | 201 + record |
| T-PAT-021 | `/patients` page | render | search/new/recent/list sections |
| T-PAT-022 | `/patients/[id]` missing | render | not found guidance |
| T-PAT-023 | `/patients/[id]` existing | render | edit form + records + triage link |
| T-PAT-024 | nav user | render | `/patients` link が見える |

---

## 7. Phase 3 - 問診フロー `/triage`

**目的**: OpenPBX の問診フローを、UI モックではなく pure flow engine + 保存連携として denwa に取り込む。

### 責務分割

| 層 | 実装 |
|----|------|
| `@openpbx/core` | flow graph 型、graph validation、step reducer、recommendation merge、summary builder |
| `apps/web` | `TriageFlow` client component、`/triage` page、patient query 連携 |
| `apps/web/server` | patient record 保存 API / Action の再利用 |

### 安全方針

問診フローは医療判断そのものではなく、電話受付時の聞き取り補助として扱う。UI には診断確定や自動治療判断に見える文言を置かず、保存される summary も「問診サマリ」とする。

### 仕様

1. flow graph の全 `next` は存在する node を指す。
2. recommend node は 0 件 recommendations を許可しない。
3. urgent / red flags は summary に保持する。
4. 戻る操作では current node と history が戻る。recommendation の自動巻き戻しは仕様化してから実装する。
5. manual recommendation 追加は重複排除する。
6. `patient` query がある場合だけ保存ボタンを出す。
7. 保存時は `kind=triage` の patient record を作る。

### Tests

| ID | Given | When | Then |
|----|-------|------|------|
| T-TRIAGE-001 | flow graph | validate | 全 next が存在 |
| T-TRIAGE-002 | recommend node | validate | recommendations が 1 件以上 |
| T-TRIAGE-003 | start node | reduce option | history に Q/A が追加される |
| T-TRIAGE-004 | recommend transition | reduce | endText + recommendations が設定される |
| T-TRIAGE-005 | duplicate recommendations | merge | 1 件に dedupe |
| T-TRIAGE-006 | urgent option | build summary | urgent marker が出る |
| T-TRIAGE-007 | memoあり | build summary | memo section が出る |
| T-TRIAGE-008 | no patient query | page render | 保存ボタンなし、案内あり |
| T-TRIAGE-009 | valid patient query | page render | 患者情報と保存ボタン |
| T-TRIAGE-010 | save triage | POST patient record | `kind=triage` で保存 |
| T-TRIAGE-011 | copy button | client state | copied state が戻る |
| T-TRIAGE-012 | print button | client action | `window.print` が呼ばれる |
| T-TRIAGE-013 | nav user | render | `/triage` link が見える |

---

## 8. Phase 4 - ブラウザソフトフォン `/softphone`

**目的**: sip.js + Asterisk WSS でブラウザから登録、発信、着信応答、切断を行える UI を作る。

### 責務分割

| 層 | 実装 |
|----|------|
| `@openpbx/core` | softphone permission policy、dial target validation、state transition model |
| `@openpbx/db` | 必要なら account-extension grant repo |
| `apps/web/server` | `getSoftphoneProfiles(me)`。secret の返却範囲を集約 |
| `apps/web/client` | `Softphone` component、SIP adapter interface、sip.js implementation |
| `asterisk` | WSS / cert / endpoint-webrtc の smoke |

### セキュリティ仕様

1. user / supervisor に全 WebRTC 内線 secret を渡さない。
2. admin は全 WebRTC 内線を選択できる。
3. user / supervisor は明示的に割り当てられた内線だけ登録できる。割当モデルを入れない場合は user には credential を返さず、admin only で初回実装する。
4. secret は page source / logs / audit details に出さない。
5. SIP 登録失敗、証明書未信頼、media permission denied を UI error として表示する。

### 仕様

1. sip.js は CDN 直読みではなく npm dependency として pin するか、明示的な integrity / version policy を docs に残す。denwa では dependency pin を優先する。
2. SIP 実装は `SipAdapter` interface 経由にし、UI state machine は fake adapter でテストする。
3. controls は register / unregister / dial / answer / hangup / mute / DTMF を持つ。
4. host 初期値は `window.location.hostname`。必要なら `/network` external signaling を候補表示する。
5. WebRTC 有効内線がない場合は empty state。

### Tests

| ID | Given | When | Then |
|----|-------|------|------|
| T-SOFT-001 | admin + webrtc extensions | get profiles | secret 付き profiles |
| T-SOFT-002 | user + no grant | get profiles | secret なし / empty |
| T-SOFT-003 | user + grant | get profiles | grant 対象だけ |
| T-SOFT-004 | invalid target | validate dial target | error |
| T-SOFT-005 | disconnected | register click | state `registering` |
| T-SOFT-006 | adapter register ok | resolve | state `registered` |
| T-SOFT-007 | adapter register fail | reject | error state |
| T-SOFT-008 | registered + target | dial click | adapter invite called |
| T-SOFT-009 | incoming invite | event | state `incoming` |
| T-SOFT-010 | incoming + answer | click | adapter accept called |
| T-SOFT-011 | inCall + hangup | click | adapter hangup called |
| T-SOFT-012 | inCall + mute | click | local audio track disabled |
| T-SOFT-013 | DTMF digit | click | adapter dtmf called |
| T-SOFT-014 | no WebRTC extension | render | empty state |
| T-SOFT-015 | page source | inspect | unauthorized secret が含まれない |
| T-SOFT-016 | README / cert docs | inspect | mkcert + trust + 8089 WSS 手順 |

---

## 9. Phase 5 - Chrome 拡張 Click-to-call

**目的**: Web ページ上の `tel:` link、平文電話番号、選択テキストから denwa の発信 API を呼び出す。

### セキュリティ仕様

OpenPBX は PBX ログイン cookie を `credentials: include` で使うが、denwa では既存の POST Origin gate と衝突しやすい。移植時は以下のどちらかを先に TDD で固定する。

| 方式 | 方針 |
|------|------|
| 推奨: extension token | `/me` または `/security` で click-to-call token を発行し、拡張は `Authorization: Bearer` で `/api/originate` を呼ぶ。cookie CSRF と分離 |
| 代替: same-origin helper page | 拡張が PBX の same-origin page を開き、その page が CSRF 条件を満たして発信する |

初回実装は extension token 方式を採用する。token は user に紐づけ、発信元内線も token policy で制限する。

### 責務分割

| 層 | 実装 |
|----|------|
| `@openpbx/core` | phone number normalization、extension token policy、manifest permission validator |
| `@openpbx/db` | click-to-call token hash repo、create/revoke/list |
| `apps/web` | token 発行/失効 UI、`/api/originate` bearer auth path |
| `chrome-extension` | MV3 manifest、options、background、content |
| `scripts` | extension static validation |

### Tests

| ID | Given | When | Then |
|----|-------|------|------|
| T-CHX-001 | `tel:03-1234-5678` | normalize | `0312345678` |
| T-CHX-002 | `+81 3 1234 5678` | normalize | `+81312345678` |
| T-CHX-003 | invalid text | normalize | null |
| T-CHX-004 | text node with number | decorate | tel link が作られる |
| T-CHX-005 | >500 text nodes | decorate | 上限で停止 |
| T-CHX-006 | manifest | validate | MV3、最小 permissions |
| T-CHX-007 | options save | fake chrome storage | baseUrl/from/token 保存 |
| T-CHX-008 | background call | fake fetch | `/api/originate` に bearer 付き POST |
| T-CHX-009 | fetch 401 | background call | user-visible error |
| T-CHX-010 | context menu selection | normalize | call が実行される |
| T-CHX-011 | token create | repo | hash 保存、plain は返却時のみ |
| T-CHX-012 | token revoke | repo | revoked token は使えない |
| T-CHX-013 | bearer token valid | originate API | audit actor が token owner |
| T-CHX-014 | bearer token wrong from | originate API | 403 |
| T-CHX-015 | no token and foreign Origin | originate API | 403 を維持 |

---

## 10. Phase 6 - docs / runbook / security gate 統合

**目的**: 新機能の使い方と危険な設定を docs と gate に反映し、README と実装の乖離を防ぐ。

### 作業

1. README に以下を追加する。
   - Tailscale / NAT 設定手順
   - WebRTC ソフトフォン証明書手順
   - Chrome 拡張インストール手順
   - 患者 / 問診の位置づけ
2. `docs/SECURITY-MAP.md` に以下を追加する。
   - softphone secret exposure policy
   - click-to-call token policy
   - network settings admin-only policy
   - patient data access/audit policy
3. `scripts/check-denwa-static.mjs` に以下を追加する。
   - unauthorized secret serialization pattern 検出
   - chrome-extension manifest permission allowlist
   - CDN sip.js 禁止または pin/integrity 必須
4. `scripts/prod-check.ts` に以下を追加する。
   - click-to-call token default / leaked secret 検出
   - WebRTC cert placeholder 検出
   - network external IP が WAN の場合の明示警告

### Tests

| ID | Given | When | Then |
|----|-------|------|------|
| T-GAP-DOC-001 | README | inspect | `/network` 手順がある |
| T-GAP-DOC-002 | README | inspect | WebRTC cert 手順がある |
| T-GAP-DOC-003 | README | inspect | Chrome 拡張手順がある |
| T-GAP-DOC-004 | SECURITY-MAP | inspect | softphone secret policy がある |
| T-GAP-DOC-005 | SECURITY-MAP | inspect | click-to-call token policy がある |
| T-GAP-SEC-001 | softphone page source fixture | static check | unauthorized secret を検出 |
| T-GAP-SEC-002 | manifest broad permissions | static check | fail |
| T-GAP-SEC-003 | CDN sip.js without pin | static check | fail |
| T-GAP-SEC-004 | default click token | prod check | fail |
| T-GAP-SEC-005 | WAN external IP enabled | prod check | warning / explicit accept |

---

## 11. 実装順

1. Phase 0 inventory / golden master
2. Phase 1 `/network`
3. Phase 2 `/patients`
4. Phase 3 `/triage`
5. Phase 4 `/softphone`
6. Phase 5 Chrome 拡張
7. Phase 6 docs / security gate

この順番にする理由は、`/network` が WebRTC の土台、`/patients` が `/triage` の保存先、`/api/originate` と token policy が Chrome 拡張の安全な土台になるため。

---

## 12. PR 分割

| PR | 内容 | 主な test ID |
|----|------|--------------|
| PR-1 | inventory / fixtures / docs scaffold | T-GAP-INV, T-GAP-GM |
| PR-2 | `/network` domain/db/infra/web | T-NET |
| PR-3 | patients domain/db/server/pages/API | T-PAT |
| PR-4 | triage flow engine + UI + patient save | T-TRIAGE |
| PR-5 | softphone profiles + SIP state machine + UI | T-SOFT |
| PR-6 | click-to-call token + Chrome extension | T-CHX |
| PR-7 | README / SECURITY-MAP / static/prod gate | T-GAP-DOC, T-GAP-SEC |

各 PR の完了条件:

1. 該当 test ID が Red から Green になっている。
2. `npm run test:gate` が green。
3. 関連 docs が更新済み。
4. 既存の import boundary と prod check を弱めていない。

---

## 13. 手動 smoke checklist

| 機能 | 手順 | 期待結果 |
|------|------|----------|
| `/network` | admin login -> `/network` -> Tailscale IP 保存 | `pjsip.d/transports.conf` 更新、reload signal 作成 |
| patients | `/patients` で `12345` 作成 -> detail で record 追加 | 一覧/詳細/最近の記録に反映 |
| triage | `/triage?patient=12345` で分岐 -> 保存 | patient record に `kind=triage` |
| softphone | WebRTC 内線を割当 -> `/softphone` register | registered または明確な cert/network error |
| Chrome extension | options に baseUrl/from/token 保存 -> tel link click | `/api/originate` audit に `click2call` |

---

## 14. 実装時に丸写ししない OpenPBX 挙動

| OpenPBX 挙動 | denwa 方針 |
|--------------|------------|
| user が `/softphone` で全 WebRTC extension secret を受け取る | admin only または account-extension grant 必須 |
| sip.js CDN 動的 script 追加 | npm pin または integrity 付き明示 policy |
| Chrome 拡張が cookie + cross-origin POST に依存 | bearer token または same-origin helper |
| IPv4 regex が `999.999.999.999` を通し得る | strict octet validation |
| 問診 UI が医学的推奨に見える | 受付補助/問診サマリとして表示し、診断確定表現を避ける |
| web lib に domain / db / infra が集中 | packages 分離を維持 |

