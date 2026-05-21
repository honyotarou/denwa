# OpenPBX gap 移植 — 進捗（TDD / SOC）

正本計画: [`OPENPBX-GAP-MIGRATION-TDD-PLAN.md`](OPENPBX-GAP-MIGRATION-TDD-PLAN.md)

## 自動ゲート（Green）

| 門番 | コマンド |
|------|----------|
| static + architecture | `npm run check:static` |
| 契約 Vitest | `npm run test:gate` |
| L4 E2E smoke | `npm run test:e2e`（`smoke-*` + `gap-authenticated`） |
| gap doc 契約 | `pbx-ops/.../openpbx-gap-doc.test.ts` |
| 本番化 | `npm run prod-check -- --expect-pass` |
| 一式 | `npm run harness` |

## テスト ID カバレッジ

| Phase | ID 範囲 | 主なテストファイル | L5 |
|-------|---------|-------------------|-----|
| 0 | T-GAP-INV, T-GAP-GM | `openpbx-gap-inventory.test.ts` | legacy clone 任意 |
| 1 | T-NET-001〜014 | `network-validate`, `gap-patients-network`, `gap-web-boundary`, `nav-policy` | G1 手動 |
| 2 | T-PAT-001〜020 | `patients-validate`, `gap-patients-network`, `gap-web-boundary` | — |
| 2 | T-PAT-008 | `patients-group.test.ts` | — |
| 2 | T-PAT-021〜023 | `e2e/gap-authenticated.spec.ts` | G2 一部自動 |
| 2 | T-PAT-024 | `nav-policy.test.ts` | — |
| 3 | T-TRIAGE-001〜007 | `triage-domain`, `openpbx-gap`, `triage-ui-state` | — |
| 3 | T-TRIAGE-004 | `triage-ui-state.test.ts`（snapshot 戻る） | — |
| 3 | T-TRIAGE-008〜010 | `e2e/gap-authenticated`, `gap-web-boundary` | G3 一部自動 |
| 3 | T-TRIAGE-011 | `triage/__tests__/triage-copy.test.tsx` | — |
| 3 | T-TRIAGE-012 | print UI（手動可） | — |
| 3 | T-TRIAGE-013 | `nav-policy.test.ts` | — |
| 4 | T-SOFT-001〜015 | `gap-phase4-5`, `softphone-panel.test.tsx` | G4 手動 |
| 4 | T-SOFT-016 | `softphone-dev-stack`, `gap-l5-runtime`, `wss-readiness`, E2E `gap-softphone` | G4b optional `E2E_WSS_PROBE=1` |
| 5 | T-CHX-* | `extension-message`, `build:chrome-ext`, E2E `gap-chrome-ext` | G5b Playwright unpacked ext |
| 6 | T-GAP-DOC-001〜005 | `openpbx-gap-doc.test.ts` | — |
| 6 | T-GAP-SEC-* | `openpbx-gap-chrome`, static, prod-check | — |

## L5 手動 smoke（§13）

チェックリスト: [`OPENPBX-GAP-SMOKE-CHECKLIST.md`](OPENPBX-GAP-SMOKE-CHECKLIST.md)（G1〜G5）。  
詳細: [`ROADMAP-MANUAL.md`](ROADMAP-MANUAL.md)。

## OpenPBX legacy parity B（別トラック）

手順: `.cursor/skills/denwa/steps-denwa.md` 付録 D。CDR・課金・同時通話等。

## SOC ルール（維持）

- domain → `@openpbx/core`
- 永続化 → `@openpbx/db/repos/*`
- 変化 + reload → `services/*` → `actions/*` → `page.tsx`
- E2E は契約の重複実装をしない
