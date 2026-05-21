# OpenPBX gap — smoke チェックリスト

契約正本: [`OPENPBX-GAP-MIGRATION-TDD-PLAN.md`](OPENPBX-GAP-MIGRATION-TDD-PLAN.md) §13。

## 自動ゲート（L3/L4 — 手動 tick 不要）

| # | 機能 | Vitest / 門番 | テスト ID |
|---|------|----------------|-----------|
| G4 | softphone | `gap-l5-runtime`, `softphone-panel`, `softphone-dev-stack`, `wss-readiness`, E2E `gap-softphone` | T-SOFT-007/016, T-SOFT-DEV |
| G5 | Chrome | `build:chrome-ext` + `extension-message` + E2E `gap-chrome-ext` + `originate-bearer` | T-CHX-004〜009, T-CHX-G5b |

| コマンド | 内容 |
|----------|------|
| `npm run build:chrome-ext` | core → `chrome-extension/background.js` / `content.js` |
| `npm run harness` | 上記を含む一式 |

## 実機のみ（Docker / ブラウザ trust）

| # | 機能 | 手順 | 期待 |
|---|------|------|------|
| G1 | `/network` | admin → 保存 | `transports.conf` + reload（L3 boundary 済み） |
| G2 | patients | CRUD + 日付グループ | Playwright `gap-authenticated` |
| G3 | triage | 分岐 → 保存 | Playwright + `triage-ui-state` |
| G4b | softphone **実 SIP** | dev certs + overlay → `E2E_WSS_PROBE=1 npm run test:e2e` または手動 REGISTER | UI `registered` |
| G5b | Chrome **実ブラウザ** | `gap-chrome-ext.spec.ts`（Playwright + unpacked ext） | tel: → Bearer POST |

G5b は [`ROADMAP-MANUAL.md`](ROADMAP-MANUAL.md) の runtime 節を参照。CI では `xvfb-run` + headed 拡張 E2E。

**完了定義**: harness Green。G4b/G5b は初回セットアップ時のみ tick、以降は regress で `harness` を優先。
