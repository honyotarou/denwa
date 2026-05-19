# Legacy 参照（OpenPBX）

このリポジトリは GitHub の **Fork ではない**。既存 OpenPBX は **読み取り専用の仕様書**として使う。

## 推奨 layout

```text
~/Documents/GitHub/
├── denwa/                 # 本リポ（TDD 再構築）
└── OpenPBX/               # legacy clone（別リポのまま）
```

## clone（初回のみ）

```bash
git clone https://github.com/tanimurahifukka/OpenPBX.git ../OpenPBX
```

## 何を legacy から読むか

| 用途 | パス（OpenPBX 側） |
|------|-------------------|
| DB スキーマ | `apps/web/src/lib/db.ts` |
| ドメイン・AMI・CDR | `apps/web/src/lib/*.ts` |
| Server Actions | `apps/web/src/app/actions.ts` |
| Asterisk 静的 dialplan | `asterisk/extensions.conf` |
| Docker | `docker-compose.yml` |
| golden 生成の元 | 上記の実行結果 → `fixtures/golden/`（本リポで作成） |

## コピー方針

- **計画書・pbx-core** → 本リポに正本化済み
- **apps/web / asterisk 一式** → Phase ごとに移植。一括コピーはしない
- **秘密・SQLite・録音** → 本リポに commit しない
