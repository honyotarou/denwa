# OpenPBX gap 移植 — 進捗（TDD / SOC）

正本計画: [`OPENPBX-GAP-MIGRATION-TDD-PLAN.md`](OPENPBX-GAP-MIGRATION-TDD-PLAN.md)

## 自動ゲート（Green）

| 門番 | コマンド |
|------|----------|
| static + architecture | `npm run check:static` |
| 契約 Vitest | `npm run test:gate` |
| L4 E2E smoke | `npm run test:e2e`（`next build` → `next start`） |
| 本番化 | `npm run prod-check -- --expect-pass` |
| 一式 | `npm run harness` |

## テスト ID カバレッジ

| Phase | ID 範囲 | 主なテストファイル | 備考 |
|-------|---------|-------------------|------|
| 0 | T-GAP-INV, T-GAP-GM | `pbx-ops/.../openpbx-gap-inventory.test.ts` | CI は OpenPBX 無しで skip 可 |
| 1 | T-NET-001〜009 | `pbx-core/.../network-validate.test.ts`, `pbx-db/.../gap-patients-network.test.ts` | |
| 1 | T-NET-010〜011 | `apps/web/.../gap-web-boundary.test.ts` | 011 は action と同型の `requireRole` |
| 1 | T-NET-012〜014 | `apps/web/.../nav-policy.test.ts` | `lib/nav-policy.ts` 単一正本 |
| 2 | T-PAT-001〜006 | `pbx-core/.../patients-validate.test.ts` | |
| 2 | T-PAT-007〜012 | `pbx-db/.../gap-patients-network.test.ts` | |
| 2 | T-PAT-013〜020 | `apps/web/.../gap-web-boundary.test.ts` | |
| 2 | T-PAT-021〜023 | E2E + 手動 | ページ DOM は L4 / manual |
| 2 | T-PAT-024 | `nav-policy.test.ts` | |
| 3 | T-TRIAGE-001〜007 | `pbx-core/.../triage-domain.test.ts`, `openpbx-gap.test.ts` | |
| 3 | T-TRIAGE-008〜009 | 手動 / E2E 拡張可 | `?patient=` 案内は page 実装済み |
| 3 | T-TRIAGE-010 | `gap-web-boundary.test.ts` | API `kind=triage` |
| 3 | T-TRIAGE-011〜012 | manual-only | copy/print は client UI |
| 3 | T-TRIAGE-013 | `nav-policy.test.ts` | |
| 4 | T-SOFT-* | `gap-phase4-5.test.ts`, E2E, softphone adapter tests | |
| 5 | T-CHX-* | `gap-phase4-5.test.ts`, `originate-bearer.test.ts` | |
| 6 | T-GAP-DOC/SEC | `SECURITY-MAP.md`, `check-denwa-static.mjs` | |

## manual-only（L5）

| 項目 | 手順 |
|------|------|
| Docker + SIP + 録音 inbox | [`ROADMAP-MANUAL.md`](ROADMAP-MANUAL.md) |
| §13 手動 smoke 表 | 同上 + gap 計画 §13 |
| host-tts | [`host-tts/README.md`](../host-tts/README.md) |

## SOC ルール（維持）

- domain → `@openpbx/core`（client は subpath のみ: `T-CLIENT-CORE-001`）
- 永続化 → `@openpbx/db/repos/*`
- 変化 + reload → `services/*` → `actions/*` → `page.tsx`
- E2E は契約の重複実装をしない（L3 で固めた境界の smoke）
