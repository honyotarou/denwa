# OpenPBX Gap / ソフトフォン — 横断レビュー（2026-05-22）

対象: `/softphone` 周辺（UI・core・sip.js adapter・WSS dev stack）  
方法: Vitest / Playwright / bench / OSS 比較 / 文献 / コスト試算（意思決定不要な調査のみ）

---

## 1. テスト追加（実施済み）

| 種別 | ファイル | 内容 |
|------|----------|------|
| Vitest | `softphone-state.test.ts` | 状態機械・validateDialTarget・statusLabel 全分岐 |
| Vitest | `softphone-register-error.test.ts` | classifySipRegisterFailure 全 kind |
| Playwright | `gap-softphone.spec.ts` | T-SOFT-019 レイアウト / T-SOFT-020 DTMF |
| Bench | `softphone-state.bench.ts` | 状態遷移・validate の tinybench |

コマンド:

```bash
npm run test -w @openpbx/core -- softphone
npm run bench:softphone
npm run test:coverage:softphone   # softphone モジュール含む coverage
npm run test:e2e -- gap-softphone
```

---

## 2. OSS 比較（SIP.js / JsSIP / OpenPBX）

| 項目 | SIP.js SimpleUser | JsSIP UA | OpenPBX legacy | denwa |
|------|-------------------|----------|----------------|-------|
| バンドル | npm `sip.js@0.21.2` | npm `jssip` | CDN 動的 script | **npm + adapter 分離** ✓ |
| UI | デモのみ（単一セッション） | 自前 | 最小 grid | **OpenPBX grid + DTMF/mute** |
| テスト | ライブラリ単体 | ライブラリ単体 | なし | **Vitest + fake SipAdapter + E2E** |
| secret 開示 | アプリ依存 | アプリ依存 | 全内線平文 | **grant / admin 分離** |
| エラー UX | delegate のみ | event のみ | `状態: string` | **classify + 日本語** |

denwa の `SipAdapter` パターンは SIP.js 公式 SimpleUser より **テスト可能**（UI と sip.js を分離）。OpenPBX の CDN 方式は CSP / SRI / 供給網リスクがあり denwa では禁止（T-GAP-SEC-003）。

---

## 3. 学術・標準トレンド（2023–2026）

| トピック | 要点 | denwa への示唆 |
|----------|------|----------------|
| RFC 7118 / SIP over WebSocket | ブラウザ SIP の標準輸送 | `wss://host:8089/ws` + サブプロトコル `sip` ✓ |
| Asterisk + WebRTC 実装論文 (2024) | PJSIP + WSS + 証明書 import がボトルネック | mkcert 手順を UI に明示 ✓ |
| USENIX Sec 2026 DTLS-SRTP | メディア層 MitM / 弱い証明書 | **SIP/TLS だけでなく Asterisk cert 品質を維持** |
| WebRTC 複雑性 | 多層スタックの監査困難 | 状態機械を pure core に固定し E2E は契約のみ |

トレンド: **シグナリング（SIP/WSS）とメディア（DTLS-SRTP）を分離してテスト**、**dev cert 運用の UX 化**、**CSP/connect-src の明示 allowlist**。

---

## 4. セキュリティレビュー

| 観点 | 評価 | メモ |
|------|------|------|
| Secret 露出 | **良** | user は grant 内線のみ（T-SOFT-001〜003） |
| WSS 輸送 | **良** | npm sip.js、CDN 禁止 |
| CSP | **良** | `connect-src` に WSS allowlist（F-028） |
| 認証 | **良** | originate は Bearer、cookie 拡張禁止 |
| DTLS-SRTP | **要運用** | mkcert dev / 本番は正当 CA + 強鍵長 |
| UI XSS | **低リスク** | React テキスト、secret は DOM に出さない |
| Rate limit | **良** | originate / API に bounded store |

残リスク（意思決定不要な記録）: 実 REGISTER 時の **マイク権限フィッシング教育**、8089 公開時の **スキャン耐性**（fail2ban 等は infra 側）。

---

## 5. パフォーマンスレビュー

| 観点 | 評価 | メモ |
|------|------|------|
| UI 状態機械 | **問題なし** | bench: ナノ秒級（pure TS） |
| sip.js bundle | **中** | client component のみ dynamic import 検討余地 |
| 同時通話 | **Asterisk 依存** | 100 UA 規模は単一 Asterisk で足りる |
| WebSocket | **1 UA = 1 接続** | 100 同時登録 ≈ 100 WSS（メモリ ~数 MB/UA 程度） |
| DTMF | **軽量** | RFC2833 / SIP INFO、UI は O(1) |

main ベースライン: softphone **domain は CPU ボトルネックにならない**。実話の遅延は **ICE/STUN/証明書 handshake** 側。

---

## 6. SRE レビュー

| 観点 | 評価 | メモ |
|------|------|------|
| 可観測性 | **中** | UI `data-state` + classify エラー。SIP trace は未統合 |
| 依存 | **中** | Asterisk + WSS overlay + mkcert 証明書 |
| 復旧 | **良** | 登録 timeout 12s、unregister cleanup |
| デプロイ | **良** | docker-compose.softphone-dev.yml で 8089 明示 |
| スモーク | **部分自動** | G4 E2E、G4b は `E2E_WSS_PROBE=1` |

推奨 runbook（記録のみ）: WSS 不通 → 8089 publish → cert 期限 → `asterisk reload`。

---

## 7. コスト試算（Active User 100 人ごと）

前提: **単一ホスト Docker**（Asterisk + Web + SQLite）、クラウド VPS、内線中心 PBX。

| AU 帯 | 同時 REGISTER 想定 | VPS 目安 | 帯域目安 | 月額目安 (USD) |
|-------|-------------------|----------|----------|----------------|
| 0–100 | ~20–40 | 2 vCPU / 4GB | ~50 GB | **$20–40** |
| 100–200 | ~40–80 | 4 vCPU / 8GB | ~100 GB | **$40–80** |
| 200–300 | ~80–120 | 4–8 vCPU / 8–16GB | ~150 GB | **$80–150** |

注: WebRTC メディアは **P2P または Asterisk リレー**で VPS egress が増える。TURN 未使用の LAN/小規模なら帯域は小さい。  
**100 AU ごとに約 +$20–40/月（VPS 1段階）** が目安。マネージド SIP (OnSIP 等) より自前 Docker は固定費が低い。

---

## 8. カバレッジ

`vitest.config.ts` の coverage `include` に `src/softphone/*` を追加。  
parity-b 6 モジュールと合わせ **branch ≥90%** を gate 対象に拡張（softphone 追加後に `npm run test:coverage:parity-b` で確認）。

---

## 9. 次の自動化候補（意思決定不要で可能）

- [ ] `register-error` の CSP 分岐 E2E（middleware nonce 環境）
- [ ] bench を CI nightly に（閾値 regression は不要、記録のみ）
- [ ] G4b WSS probe を dev overlay CI job に

---

*生成: denwa 自律タスク消化（外出中バッチ）*
