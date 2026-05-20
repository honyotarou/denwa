# Golden master fixtures

代表出力の正本。計画書 `docs/TDD-REBUILD-PLAN.md` §4.4。

| ID | パス | 由来 |
|----|------|------|
| T-GM-001 | `current/pjsip/extensions.conf` | legacy `extensions.ts` — 内線 1001 SIP + 1002 WebRTC |
| T-GM-002 | `current/dialplan/ringgroups.conf` | legacy `ringGroups.ts` — ringall / linear / 空メンバー |
| T-GM-003 | `current/dialplan/pickup.conf` | legacy `pickupGroups.ts` — `*8` → `Pickup()` |
| T-GM-004 | `current/dialplan/ivr.conf` | legacy `ivr.ts` — DB 駆動 IVR |
| T-GM-005 | `current/dialplan/trunks.conf` | legacy `trunks.ts` — inbound DID + outbound prefix |
| T-GM-006 | `current/dialplan/business-hours.conf` | legacy `businessHours.ts` — 祝日 + GotoIfTime |
| T-GM-007 | `current/cdr/master-row.csv` + `parsed.json` | Asterisk 18 フィールド CDR 行 |
| T-GM-008 | `current/inbox/meta.json` | `notify-event.sh` / §9.3 — `buildInboxMeta` |
| T-GM-009 | `current/docker/compose-normalized.json` | legacy `docker-compose.yml` — `normalizeDockerCompose` |

各 `*.input.json` は再生成用。秘密はテスト用ダミーのみ。仕様変更時は fixture 更新 PR に理由を書く。
