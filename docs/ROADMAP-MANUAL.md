# Roadmap 手動 smoke（L5 / manual-only）

`docs/TDD-REBUILD-PLAN.md` Phase 8 の **実機・Docker ランタイム** は Vitest では代替しません。リリース前に人が以下を確認します。

OpenPBX gap 機能（network / patients / triage / softphone / Chrome）の tick 表は [`OPENPBX-GAP-SMOKE-CHECKLIST.md`](OPENPBX-GAP-SMOKE-CHECKLIST.md) を使う。

## 前提

```bash
docker compose up -d
# AMI_SECRET 等は .env または compose で本番用に設定
npm run dev   # または web コンテナ
```

## Phase 8: Asterisk / 通話

| # | 手順 | 期待 |
|---|------|------|
| 1 | `docker compose ps` で asterisk / web が Up | 両方 healthy |
| 2 | web コンテナから `AMI_HOST=asterisk:5038` で Manager 接続 | Login Success（ログにエラーなし） |
| 3 | 内線 1001 を SIP クライアントまたは `/softphone` で **REGISTER** | Registered |
| 4 | 1001 → 1002 発信 | 両方鳴る / 通話成立 |
| 5 | 着信グループ 6001 に外部または内線から着信 | メンバーが順に鳴る |

## Phase 9: 周辺

| # | 手順 | 期待 |
|---|------|------|
| 6 | Chrome 拡張 options に URL / from / Bearer token | 保存できる |
| 7 | 任意ページの `tel:` クリック | `/api/originate` 200、Asterisk が発信 |
| 8 | 録音付き着信後 `data/inbox/` | `meta.json` + wav |

## 失敗時

- WSS / 証明書: `asterisk/certs/README.md`
- originate 502: `AMI_SECRET`、内線番号、Asterisk ログ
- 詳細: `README.md` 手動 smoke 節
