# OpenPBX フロントエンド計画

**目的**: OpenPBX の利用者が触れる層（Next.js App Router の画面・共通コンポーネント・ナビ・状態の見せ方）について、**デザイン規約と実装ガイド**を 1 本にまとめる。

**読者**: フロントエンドの実装者（人間・Claude などのエージェント）と、画面確認をするオペレーター。

**REBUILD-PLAN との関係**: ページ一覧・Server Action 40 本・Route Handler・認可・監査 enum・テスト ID は `docs/TDD-REBUILD-PLAN.md` が **正本** であり、本書は重複させない。本書が定義するのは「どう見えるか」「どう作るか」だけ。両者で食い違ったら REBUILD-PLAN を優先する。

**TDD はしない**: backend は TDD で再構築するが、フロントは画面と動作の整合がレビューしやすいので、TDD サイクル（Red→Green→Refactor）は強制しない。テストを書く場合は §11 の最小ルールに従う。

---

## 1. 設計原則

### 1.1 守るべき 7 つのルール

1. **業務ロジックは UI に入れない**。フォームの値はそのまま Server Action / Route Handler に渡し、検証は backend（`@openpbx/core`）に任せる。フロントは「型」と「見せ方」だけ持つ。
2. **secret は admin にしか出さない**。`/extensions` の secret は user/supervisor には `••••` でマスク、admin だけ平文表示（コピー用ボタン付き）。
3. **必須状態を必ず実装する**（§5）。loading / empty / error / success / disabled / permission denied / destructive confirmation の 7 種。どれかを省くなら理由をコメントで残す。
4. **ロール別に見え方を変える**（§8）。admin / supervisor / user の 3 段。権限不足のメニュー・操作は **非表示** または **disabled**。
5. **キーボードで全主要操作ができる**。Tab 順、focus ring、Enter/Escape、destructive は confirm 経由。
6. **長文・大量行で破綻させない**。番号 6 桁・displayName 64 文字・note 256 文字、CDR 1000 行、IVR 10 オプションでもレイアウトが壊れない。
7. **ランディング・説明ページは作らない**。`/` はダッシュボード（数字とリンク）のみ。マーケ的な文章や図は置かない。

### 1.2 既存のスタイル方針

現行 `apps/web` で確立している方針をそのまま採用する。

- Tailwind CSS（モバイルファースト、ユーティリティクラス直書き）
- Slate を中立色、Blue を primary、Red を error、Emerald を success
- `tabular-nums` で数字列を揃える
- `rounded` / `border` / `shadow-sm` の控えめなカード
- 絵文字はステータスマークと 👤 だけ許容（装飾の絵文字は避ける）

---

## 2. デザインシステム

### 2.1 カラー（Tailwind）

| 用途 | クラス | 使いどころ |
|------|--------|-----------|
| 背景（中性） | `bg-white` / `bg-slate-50` | カード本体 / 補助背景 |
| 区切り線 | `border-slate-200` | カード枠、テーブル罫線 |
| テキスト主 | `text-slate-900`（既定） | 本文 |
| テキスト副 | `text-slate-700` | 補助、見出し小 |
| テキスト弱 | `text-slate-500` | ラベル、ヒント |
| テキスト微 | `text-slate-400` | timestamp、`-`（空値） |
| Primary | `bg-blue-600` / `hover:bg-blue-700` / `text-white` | 主アクション、フォーカスリング `ring-blue-500` |
| Primary link | `text-blue-600 hover:underline` | テキストリンク |
| Success | `bg-emerald-50 border-emerald-300 text-emerald-800` | `?ok=` flash、登録完了 |
| Error | `bg-red-50 border-red-300 text-red-800` | `?err=` flash、フィールド error |
| Warning | `bg-amber-50 border-amber-300 text-amber-800` | 一時的な注意（upgrade 予定・AMI 未接続） |
| Disabled | `bg-slate-100 text-slate-400 cursor-not-allowed` | 権限不足ボタン |
| Destructive | `bg-red-600 hover:bg-red-700 text-white` | 削除確定ボタン（`ConfirmButton` の中身） |

**禁止**: 上記以外の色相を独自に追加する（`bg-purple-*` など）。緑/赤/青/琥珀/灰の 5 系統で完結させる。

### 2.2 タイポグラフィ

| 用途 | クラス |
|------|--------|
| ページ見出し H2 | `text-lg font-semibold` |
| セクション見出し H3 | `text-sm font-semibold text-slate-700` |
| 本文 | `text-sm`（既定） |
| ラベル | `text-xs text-slate-600` |
| ヒント | `text-xs text-slate-500` |
| 微小注釈 | `text-[10px] text-slate-400` |
| 数字（強調） | `text-2xl font-bold tabular-nums` |
| 数字（行内） | `font-mono tabular-nums` |
| コード片 | `<code className="rounded bg-slate-100 px-1">` |

フォントは Next.js の既定（sans）+ Tailwind の `font-mono`。Web フォント追加は禁止（ロード時間が画面 22 枚に効く）。

### 2.3 余白・グリッド・レスポンシブ

| 役割 | 値 |
|------|-----|
| 全体最大幅 | `max-w-5xl mx-auto px-4` |
| ページ縦余白 | `py-6` |
| セクション間 | `space-y-6` |
| カード内余白 | `p-3` / `p-4` |
| フォーム行間 | `space-y-3` |
| フォーム入力高 | `py-1`（コンパクト） |
| ブレークポイント | sm=640 / md=768 / lg=1024 を使用、xl 以上は targets しない |

レイアウトは **モバイルファースト**。640px 未満で：
- ナビは横スクロール（`overflow-x-auto`、`whitespace-nowrap`）
- グリッドは 1〜2 列まで縮退
- テーブルは横スクロール（`overflow-x-auto`）

### 2.4 アイコン・記号

- アイコンライブラリは導入しない（依存を増やさない）
- 状態マーク: `⚠️`（error） / `✅`（success） / `👤`（profile） / `●`（オンライン） / `○`（オフライン）
- 削除ボタン: 「削除」テキスト + 赤背景。ゴミ箱アイコンは使わない（文字列の方が a11y で読みやすい）

---

## 3. 共通コンポーネント仕様

### 3.1 AppShell（layout.tsx）

```
┌─ <html lang="ja"> ───────────────────────────────────────┐
│ <body min-h-screen>                                       │
│ ┌─ <header sticky top-0 border-b bg-white> ────────────┐ │
│ │  Command Room PBX            [NavBar]         👤 me   │ │
│ └──────────────────────────────────────────────────────┘ │
│ ┌─ <Suspense><FlashBanner /></Suspense> ───────────────┐ │
│ │  ✅ 内線 1001 を作成しました                          │ │
│ └──────────────────────────────────────────────────────┘ │
│ ┌─ <main max-w-5xl mx-auto px-4 py-6> ─────────────────┐ │
│ │  page children                                        │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

- ヘッダは `sticky top-0 z-10`
- FlashBanner は `sticky top-12 z-20`（ヘッダの下）
- メインは `max-w-5xl`、左右 `px-4`

### 3.2 NavBar

- 表示はロール別（§8）
- 項目は `<a className="rounded px-2 py-1 hover:bg-slate-100 focus:ring-2 focus:ring-blue-500">`
- 現在ページの強調は `aria-current="page"` + `bg-slate-100`（フレームワークの `usePathname` で判定）
- モバイル: `flex overflow-x-auto whitespace-nowrap gap-3`
- 👤 ユーザー名リンクは右端に分離、ml-auto

### 3.3 FlashBanner

- URL の `?ok=`・`?err=` を読み、4 秒で自動消去 + URL から該当 query を削除
- `?err=` → `role="alert"` + 赤系
- `?ok=` → `role="status"` + 緑系
- 文言は **日本語短文**。技術用語を出さない（例: `permission_denied` ではなく `権限がありません`）。日本語マッピングは backend 側で行うか、フロントで `FLASH_MESSAGES` 辞書を持つ（コードは backend 由来でも文言の出力はフロント責務）

### 3.4 ConfirmButton

- 用途: 全 `delete*Action`、`disableTotpAction`、`deleteUpgradeAction`、ロール降格などの破壊的操作
- `window.confirm(message)` を使う（モーダルコンポーネントは導入しない、ネイティブで十分）
- confirm 後に `disabled`、二重 submit ガード
- 文言には対象を含める: 「内線 1001 を削除しますか？」「アカウント tanaka を削除しますか？取り消せません。」

### 3.5 Card

```
┌──────────────┐
│ label        │  <div text-xs text-slate-500>
│ 1,234        │  <div text-2xl font-bold tabular-nums>
│ hint         │  <div text-[10px] text-slate-400>
└──────────────┘
```

- href ありの場合は `<a>` で包む（hover で `bg-slate-50`）
- バリエーション: 大（数字メイン）/ 小（リスト 1 行）

### 3.6 Field（label + input + error）

```
ユーザー名
[                              ]
※ 半角英数 3〜32 文字
ユーザー名は必須です        ← error 時のみ、role="alert"
```

- ラベル `text-xs text-slate-600` + input
- error あり時 `aria-invalid="true"` + `aria-describedby` で error メッセージに紐付け
- 入力中の中間バリデーションはしない（送信して backend からの結果を待つ）

### 3.7 Table

```
┌──────┬──────────┬─────────────┬────────┐
│ 番号 │ 表示名    │ 最終更新     │ 操作   │
├──────┼──────────┼─────────────┼────────┤
│ 1001 │ 受付      │ 09:30:00    │ [編集] │
└──────┴──────────┴─────────────┴────────┘
```

- `<th scope="col">` を必須
- 行少: `<thead>` + `<tbody>`、shadow なし
- 行多（>20）: sticky header（`thead` を `sticky top-0`）+ `max-h-[60vh] overflow-y-auto`
- モバイルは `overflow-x-auto` で横スクロール

### 3.8 EmptyState

```
┌────────────────────────────────────────────┐
│           まだ内線が登録されていません       │
│       内線を追加して通話を開始しましょう。   │
│                                            │
│              [ 内線を追加 ]                 │
└────────────────────────────────────────────┘
```

- アイコンは使わない（テキスト + プライマリ操作のみ）
- backend 接続エラーの場合は ErrorState を別途用意する（後述）

### 3.9 ErrorState

```
┌────────────────────────────────────────────┐
│  ⚠️ データを取得できません                  │
│   AMI に接続できていない可能性があります。   │
│                                            │
│              [ 再読み込み ]                 │
└────────────────────────────────────────────┘
```

- error の場合は EmptyState と見た目を分ける（赤枠 or `⚠️` を付ける）

### 3.10 ボタン

| 種類 | クラス例 | 用途 |
|------|---------|------|
| Primary | `bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-semibold` | 主アクション |
| Secondary | `border border-slate-300 hover:bg-slate-50 px-3 py-1 rounded text-sm` | 副アクション |
| Destructive | `bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-semibold` | 削除（ConfirmButton 内） |
| Ghost link | `text-blue-600 hover:underline` | テキストリンク |
| Disabled | `bg-slate-100 text-slate-400 cursor-not-allowed` | 権限不足 |

**全ボタン**: `focus:outline-none focus:ring-2 focus:ring-blue-500` を必ず付ける。

---

## 4. 状態の見せ方

| 状態 | 見え方 | 例 |
|------|--------|-----|
| loading | RSC は `Suspense fallback="読込中…"`、クライアントは `<div>読込中…</div>` または skeleton 1〜3 行（高さは最終形と同等にして CLS を防ぐ） | `/devices` の SSE 接続前 |
| empty | `EmptyState` コンポーネント。説明 1 文 + 主操作ボタン | 内線 0 件の `/extensions` |
| error | フォーム外: `FlashBanner` の `?err=`<br>フォーム内: フィールド下 `role="alert"`<br>データ取得失敗: `ErrorState` コンポーネント | login 失敗、AMI 切断 |
| success | `?ok=` flash、4s で消える。リスト系は再描画して結果を反映 | 内線作成成功 |
| disabled / submitting | ボタン disabled + spinner なし（文字「処理中…」）、二重 submit ガード | フォーム送信中 |
| permission denied | 該当ナビ非表示、ページ直接 GET 時は `?err=権限がありません` で `/` redirect、個別操作はボタン disabled + tooltip | user が `/accounts` を開く |
| destructive confirm | `ConfirmButton` 経由のみ。confirm 文言に対象 ID を含める | 内線削除 |

**禁止**: トースト通知ライブラリの導入（FlashBanner で代替）、モーダルダイアログコンポーネント（window.confirm で代替）。

---

## 5. ページごとのワイヤーフレーム（22 画面）

以下、各画面の主要レイアウトと state を ASCII で示す。すべて max-w-5xl 内に収まる前提。authentication が必要なページは layout の header + FlashBanner が常に上に付く（省略）。

### 5.1 `/` ダッシュボード（user+）

```
PBX 概要
Asterisk ベース PBX の状態と設定への入り口。

┌─登録済み内線─┐ ┌─オンライン端末─┐ ┌─Inbox wav─┐ ┌─Inbox meta─┐
│ 12          │ │ 8 / 12         │ │ 3         │ │ 3          │
│ →extensions │ │ AMI 接続中     │ │ 待機       │ │ event JSON │
└─────────────┘ └────────────────┘ └───────────┘ └────────────┘
最終 pjsip 更新: 2026-05-19 09:30:00

┌─接続情報─────────────────────────────────────┐
│ SIP signaling   <Mac IP>:5060 (UDP/TCP)        │
│ RTP media       10000-10020/udp                │
│ 特番             9000 / 9001 / 9002             │
│ Inbox           /app/data/inbox                 │
│ 録音             /app/data/recordings           │
│ pjsip.d         /asterisk/pjsip.d              │
└─────────────────────────────────────────────┘

┌─登録済み内線 (12)─────────────────────────────┐
│ 1001  受付            メイン                   │
│ 1002  作業場          内勤                     │
│ ...                                           │
│ → 端末を追加・編集する                          │
└─────────────────────────────────────────────┘
```

- empty: 「内線がまだ登録されていません」+ `[ 内線を追加 ]`
- AMI 未接続: 「オンライン端末」カードの hint を `AMI 未接続` + amber 背景

### 5.2 `/login` ログイン（public）

```
        ┌──────────────────────────┐
        │ ログイン                  │
        │ Command Room PBX 管理画面 │
        ├──────────────────────────┤
        │ ユーザー名                │
        │ [                      ] │
        │                          │
        │ パスワード                │
        │ [                      ] │
        │                          │
        │ 2FA コード (有効な場合)    │
        │ [                      ] │
        │                          │
        │ [    ログイン    ]        │
        │                          │
        │ 初回は admin / ... で…    │
        └──────────────────────────┘
```

- error: `?err=...` で上に flash + フォーム下に「ログインに失敗しました。」
- 既ログイン: `?next=` または `/` に redirect

### 5.3 `/extensions` 内線 CRUD（user+、secret は admin のみ）

```
内線管理
内線番号は 2〜6 桁、内線通話と特番に使う。

┌─新規追加────────────────────────────────────┐
│ 番号    [    ] (2〜6 桁)                      │
│ 表示名  [                ]                    │
│ secret  [                ] (admin のみ表示)   │
│ 備考    [                ]                    │
│ ☐ WebRTC 対応 (ソフトフォン用)                │
│ [ 追加 ]                                      │
└────────────────────────────────────────────┘

┌─登録済み (12)──────────────────────────────┐
│ 1001  受付      secret: ••••  ☐ webrtc      │
│       [編集] [削除]                         │
│ 1002  作業場    secret: ••••  ☑ webrtc      │
│       [編集] [削除]                         │
└────────────────────────────────────────────┘
```

- secret 表示: admin = 平文 + 📋 コピーボタン、それ以外 = `••••`
- empty: 「内線がまだ登録されていません」
- 削除: `ConfirmButton` で「内線 1001 を削除しますか？」

### 5.4 `/devices` 端末状態（user+）

```
端末状態 (AMI SSE)
内線の登録状態をリアルタイムで表示。

┌──────┬──────────┬──────────────┬──────────────┐
│ 番号  │ 状態      │ 最終 contact  │ 最終 state  │
├──────┼──────────┼──────────────┼──────────────┤
│ ● 1001│ NOT_INUSE│ 09:30:00     │ available    │
│ ● 1002│ INUSE    │ 09:31:12     │ in call      │
│ ○ 1003│ -        │ -            │ offline      │
└──────┴──────────┴──────────────┴──────────────┘
```

- loading: SSE 接続前は「AMI へ接続中…」
- error: 「AMI に接続できません」+ 再接続バックオフ表示
- empty: 「内線が登録されていません」→ `/extensions` リンク

### 5.5 `/ring-groups` 着信グループ（user+）

```
着信グループ
6XXX 帯に着信したら、グループのメンバーに同時/順次着信。

┌─新規追加────────────────────────────────────┐
│ 番号 [6___] 名前 [           ] 戦略 [ringall▾]│
│ 呼出秒 [30] フォールバック [____]              │
│ メンバー: ☐1001 ☐1002 ☐1003                  │
│ [ 追加 ]                                      │
└────────────────────────────────────────────┘

┌─登録済み (3)──────────────────────────────┐
│ 6000  営業         ringall  30s            │
│       メンバー: 1001 (pri 1), 1002 (pri 1) │
│       [編集] [削除]                         │
└────────────────────────────────────────────┘
```

- strategy が `linear` の時だけ priority 入力欄を表示
- empty: EmptyState

### 5.6 `/pickup-groups` ピックアップ（user+）

```
ピックアップグループ
*8 で同じグループの鳴っている内線を取る。

┌─新規追加─────────────────────────────────┐
│ 名前 [営業] メンバー: ☐1001 ☐1002 ☐1003  │
│ [ 追加 ]                                  │
└──────────────────────────────────────────┘

┌─登録済み (2)──────────────────────────┐
│ 営業    メンバー: 1001, 1002             │
│         [編集] [削除]                    │
└──────────────────────────────────────┘
```

### 5.7 `/phonebook` 電話帳（user+）

```
電話帳

検索 [                ] [検索]

┌──────────────┬────────────────┬──────────────┐
│ 名前          │ 番号            │ 操作         │
├──────────────┼────────────────┼──────────────┤
│ 山田太郎      │ 0312345678     │ [編集] [削除]│
└──────────────┴────────────────┴──────────────┘

┌─新規追加────────────────────────────────┐
│ 名前 [        ] 番号 [          ] 備考[ ]│
│ [ 追加 ]                                 │
└──────────────────────────────────────┘
```

- empty: 「電話帳が空です」

### 5.8 `/business-hours` 営業時間（user+）

```
営業時間

## 祝日
[ 日付 YYYY-MM-DD  名称           [ 登録 ] ]
2026-01-01  元日       [削除]
2026-05-05  こどもの日 [削除]

## 時間帯ルール
┌─新規追加────────────────────────────────┐
│ 名前 [営業時間] 曜日 ☑月☑火☑水☑木☑金☐土☐日│
│ 開始 [09:00] 終了 [18:00] 動作 [通常▾]   │
│ [ 追加 ]                                  │
└─────────────────────────────────────────┘

ルール一覧:
営業時間   月〜金 09:00-18:00  通常    [編集] [削除]
夜間       月〜金 18:00-22:00  留守録  [編集] [削除]
```

### 5.9 `/ivr` IVR エディタ（user+）

```
IVR メニュー

┌─メニュー 8001─────────────────────────────┐
│ 名前 [   メイン   ]                        │
│ ガイダンス [welcome▾]                       │
│ オプション:                                 │
│   1 → [extension▾] [1001]   [削除]         │
│   2 → [ringgroup▾] [6000]   [削除]         │
│   0 → [extension▾] [1001]   [削除]         │
│ [+ 行追加]                                  │
│ retry [3]  timeout [5]                      │
│ [ 保存 ]                                    │
└────────────────────────────────────────────┘
```

- digit は 0〜9 のみ、重複はフォーム送信前に backend 検証

### 5.10 `/guidances` ガイダンス wav（user+）

```
ガイダンス音声 (wav)

┌─アップロード────────────────────────────────┐
│ 名前 [welcome]  ファイル [選択...]  [送信]   │
│ ※ wav 形式、SOUNDS_DIR/<name>.wav に保存     │
└────────────────────────────────────────────┘

┌────────────┬──────────────┬─────────────────┐
│ 名前        │ サイズ        │ 操作            │
├────────────┼──────────────┼─────────────────┤
│ welcome    │ 32 KB        │ [▶ 再生] [削除] │
│ closed     │ 18 KB        │ [▶ 再生] [削除] │
└────────────┴──────────────┴─────────────────┘
```

- multipart upload、wav 以外は backend が 400 で reject、フロントは flash 表示
- 再生は `<audio src="/api/recordings/...">` でも `<audio src="/sounds/...">` でもなく、ガイダンス専用 endpoint があれば使う（無ければ削除のみ）

### 5.11 `/cdr` 発着信履歴（user+）

```
発着信履歴

[ from 2026-05-01 ] [ to 2026-05-19 ] [ src      ] [ dst      ] [ disposition ▾ ] [絞り込み]
                                                                              [いま取り込む (supervisor+)]

┌────────────────────┬────────┬───────────┬─────────┬──────────┬────────┐
│ 開始時刻 (JST)      │ src    │ dst       │ 通話秒  │ 結果      │ 操作   │
├────────────────────┼────────┼───────────┼─────────┼──────────┼────────┤
│ 2026-05-19 09:30:00│ 1001   │ 6000      │ 00:42   │ ANSWERED │ [録音] │
│ 2026-05-19 09:25:11│ 03-...│ 1002       │ 00:05   │ NO_ANSWER│        │
└────────────────────┴────────┴───────────┴─────────┴──────────┴────────┘

[ < 前 ]  1 / 12  [ 次 > ]
```

- フィルタは querystring と同期、debounce 300ms
- empty: 「該当する CDR がありません」
- 「いま取り込む」は supervisor+ にのみ表示

### 5.12 `/recordings` 録音（user+）

```
録音一覧

┌────────────────────────────────┬──────────┬──────────────┐
│ ファイル                        │ サイズ    │ 再生          │
├────────────────────────────────┼──────────┼──────────────┤
│ 1700000000.1-9001-1001.wav     │ 240 KB   │ [▶ 再生]      │
└────────────────────────────────┴──────────┴──────────────┘
```

- 再生は `<audio src="/api/recordings/{file}" controls preload="none">`
- empty: 「録音がまだありません」

### 5.13 `/concurrency` 同時通話（user+）

```
同時通話

┌─直近 24h の最大同時通話─┐
│  ▁▂▁▃▂▁▁▂▄▃▂▁▁▁▂▁▁▁▂▁ │   (簡易 sparkline、CSS のみ)
│  最大 4 (12:15)          │
└────────────────────────┘

┌────────────┬─────────┐
│ 時刻 (JST) │ 同時通話│
├────────────┼─────────┤
│ 12:15      │ 4       │
│ 12:14      │ 3       │
└────────────┴─────────┘
```

### 5.14 `/softphone` WebRTC ソフトフォン（user+）

```
ソフトフォン (WebRTC)

┌────────────────────────────────────────────┐
│ 内線 [1001 ▾]   secret [自動取得]            │
│ 状態: ● 登録済 (Registered)                 │
│ [ 解除 ]                                    │
│                                            │
│ 発信先 [        ]  [ 発信 ]                 │
│ 着信なし                                    │
│                                            │
│ 通話中 → 00:42                              │
│ [ 終了 ] [ ミュート ] [ DTMF ]              │
└────────────────────────────────────────────┘
```

- 状態に応じて表示要素を切替（idle / registering / registered / calling / inCall）
- sip.js は CDN 動的ロード、失敗時は ErrorState
- マイク権限が無い場合は flash で説明

### 5.15 `/billing` 課金（supervisor+）

```
通話料金

┌─レート表（prefix 単位）────────────────────────┐
│ prefix    │ 単価/分 │ セットアップ │ 操作       │
├──────────┼─────────┼──────────────┼───────────┤
│ 0120     │ ¥0      │ ¥0           │ [削除]    │
│ 080      │ ¥17     │ ¥0           │ [削除]    │
│ 03       │ ¥9      │ ¥0           │ [削除]    │
└──────────┴─────────┴──────────────┴───────────┘
[新規] prefix [    ] 単価/分 [    ] セットアップ [    ] [追加]

## 月次集計 (2026-05)
通話回数 124  通話秒 18,432  概算料金 ¥3,210
```

### 5.16 `/audit` 監査・ログイン履歴（supervisor+）

```
監査ログ (最新 200 件)

┌──────────────────┬─────────┬─────────────────────┬──────────┐
│ 時刻 (JST)        │ user    │ action              │ target   │
├──────────────────┼─────────┼─────────────────────┼──────────┤
│ 2026-05-19 09:30 │ admin   │ extension.create    │ 1001     │
│ 2026-05-19 09:25 │ tanaka  │ login               │          │
│ 2026-05-19 09:24 │ tanaka  │ login.failed        │          │
└──────────────────┴─────────┴─────────────────────┴──────────┘

## ログイン履歴
2026-05-19 09:25  tanaka  success  192.168.1.10
2026-05-19 09:24  tanaka  failed   192.168.1.10
```

### 5.17 `/accounts` アカウント（admin）

```
アカウント管理

┌─新規追加────────────────────────────────────┐
│ ユーザー名 [      ] 表示名 [       ]          │
│ ロール [user▾]  初期パスワード [       ]      │
│ [ 追加 ]                                      │
└────────────────────────────────────────────┘

┌──────────┬──────────────┬──────────┬─────────────────────┐
│ ユーザー名│ 表示名        │ ロール   │ 操作                 │
├──────────┼──────────────┼──────────┼─────────────────────┤
│ admin     │ 管理者        │ admin▾   │ [PW変更] [削除]      │
│ tanaka    │ 田中          │ user▾    │ [PW変更] [削除]      │
└──────────┴──────────────┴──────────┴─────────────────────┘
```

- 最後の admin を削除/降格しようとした時は backend が拒否、フロントは事前に Confirm 文言で警告

### 5.18 `/security` ポリシー・IP（admin）

```
セキュリティ

## パスワードポリシー
最小長 [12]  ☑ 大文字必須  ☑ 数字必須  ☑ 記号必須
[ 保存 ]

## IP 許可リスト (CIDR)
┌─新規追加─────────────────────┐
│ CIDR [10.0.0.0/8] 備考[社内]  │
│ [ 追加 ]                       │
└──────────────────────────────┘
10.0.0.0/8     社内    [削除]
192.168.0.0/16 自宅    [削除]
```

### 5.19 `/trunks` SIP trunk（admin）

```
SIP Trunk

┌─新規追加 / 編集──────────────────────────────┐
│ 名前 [trunk-a]  host [sip.example.com]        │
│ port [5060]   username [    ] secret [    ]   │
│ fromUser [   ] fromDomain [          ]        │
│ ☑ register                                    │
│ inbound DID [03-1234-5678]                    │
│ outbound prefix [0]                           │
│ [ 保存 ]                                      │
└──────────────────────────────────────────────┘

┌────────────┬──────────┬─────────┬─────────┐
│ 名前        │ host     │ DID     │ 操作    │
├────────────┼──────────┼─────────┼─────────┤
│ trunk-a    │ sip.ex...│ 03-...  │ [編集][削除]│
└────────────┴──────────┴─────────┴─────────┘
```

### 5.20 `/upgrades` バージョンアップ予約（admin）

```
バージョンアップ予約

┌─新規予約────────────────────────────────────┐
│ image tag [v1.2.0]  予定 [2026-06-01 02:00]   │
│ メモ [メンテ告知済み]                          │
│ [ 予約 ]                                      │
└────────────────────────────────────────────┘

┌─予約一覧─────────────────────────────────┐
│ v1.2.0  2026-06-01 02:00  メンテ告知済み  │
│         [削除]                           │
└──────────────────────────────────────────┘
```

### 5.21 `/me` マイアカウント・2FA（self）

```
マイアカウント

ユーザー名: tanaka
ロール: user

## 表示名
[ 田中太郎 ]  [ 保存 ]

## パスワード変更
現在のパスワード [        ]
新しいパスワード [        ]
[ 変更 ]

## 2 段階認証 (TOTP)
状態: 未設定
[ 設定する ]

(設定後の表示)
状態: 有効
QR (初回のみ): [□□□□]
シークレット: ABCD....    [📋 コピー]
[ 無効化 ]  ← ConfirmButton
```

---

## 6. 主要フロー

### 6.1 ログイン → ダッシュボード

```
未ログインで /extensions を踏む
  ↓ middleware
/login?next=/extensions
  ↓ form submit (loginAction)
session cookie 設定 + login_history 追記
  ↓ redirect
/extensions   (元の next に戻る)
```

### 6.2 内線作成 → 確認 → 通話

```
/extensions [追加]
  ↓ createExtensionAction
  ↓ @openpbx/core で validation
  ↓ DB insert + pjsip.d/extensions.conf 再生成
  ↓ ASTERISK_SIGNAL_DIR に reload signal
redirect /extensions?ok=internal_created
  ↓
/devices で SSE 経由でその内線の登録待ち
  ↓ クライアント (sip.js / softphone) が REGISTER
状態が NOT_INUSE になり、ダッシュボードのオンライン数 +1
```

### 6.3 削除（destructive）

```
[削除] ボタン (ConfirmButton)
  ↓ window.confirm("内線 1001 を削除しますか？")
  └ Cancel → 何もしない
  ↓ OK
  ↓ form submit
deleteExtensionAction
  ↓ DB delete + pjsip 再生成 + reload
redirect ?ok=deleted
```

### 6.4 権限不足アクセス

```
user ロールで /accounts を直接 GET
  ↓ layout が ナビから /accounts を非表示
  ↓ page.tsx 冒頭の requireRole で 403
redirect /?err=permission_denied
  ↓ FlashBanner
"権限がありません" (赤)
```

### 6.5 着信 → 録音 → inbox

```
外線 → trunk → IVR → 9001 を選択
  ↓ Asterisk Record
data/recordings/<file>.wav 生成
  ↓ notify-event.sh
data/inbox/<file>.wav + <file>.meta.json
  ↓ 別リポ (command-room-ai) が監視・処理
ダッシュボードの "Inbox wav / meta" カウンタに反映
```

---

## 7. ロール別表示マトリクス

| 画面 / 操作 | user | supervisor | admin |
|------------|------|-----------|-------|
| `/` ダッシュボード | ✓ | ✓ | ✓ |
| `/extensions` 閲覧 | ✓（secret マスク） | ✓（secret マスク） | ✓（secret 平文） |
| `/extensions` CRUD | ✓ | ✓ | ✓ |
| `/devices` SSE | ✓ | ✓ | ✓ |
| `/ring-groups` `/pickup-groups` `/phonebook` `/business-hours` `/ivr` `/guidances` `/cdr` `/recordings` `/concurrency` `/softphone` | ✓ | ✓ | ✓ |
| `/cdr` の「いま取り込む」ボタン | 非表示 | ✓ | ✓ |
| `/billing` | 非表示 | ✓ | ✓ |
| `/audit` | 非表示 | ✓ | ✓ |
| `/accounts` `/security` `/trunks` `/upgrades` | 非表示 | 非表示 | ✓ |
| `/me` | ✓ | ✓ | ✓ |

非表示は **ナビ非表示 + 直接 URL アクセスは `/?err=権限がありません` redirect** の両方で守る。

---

## 8. 実装ガイド

### 8.1 ディレクトリ規約

```
apps/web/src/
  middleware.ts              ← public path + 未ログイン redirect/401
  app/
    layout.tsx               ← AppShell（header + NavBar + FlashBanner）
    globals.css              ← Tailwind directive のみ
    page.tsx                 ← /
    actions.ts               ← 40 Server Action（薄い呼び口、検証は core）
    login/page.tsx
    me/page.tsx
    extensions/page.tsx
    devices/
      page.tsx               ← server component（初期一覧）
      device-list.tsx        ← 'use client'（EventSource）
    softphone/
      page.tsx               ← server component（auth check + props）
      softphone.tsx          ← 'use client'（sip.js）
    ... (他 16 ページ)
    api/
      cdr/ingest/route.ts
      devices/stream/route.ts
      extensions/route.ts
      extensions/[number]/route.ts
      guidances/route.ts
      originate/route.ts
      phonebook/lookup/route.ts
      recordings/[file]/route.ts
  components/
    AppShell.tsx             ← 任意。layout.tsx の中身を分けるなら
    NavBar.tsx
    FlashBanner.tsx
    ConfirmButton.tsx
    Card.tsx
    Field.tsx
    Table.tsx
    EmptyState.tsx
    ErrorState.tsx
  lib/
    auth.ts                  ← getCurrentAccount, requireRole（薄いラッパー、検証は core）
    flash.ts                 ← URL ?ok=/?err= のヘルパ
    datetime.ts              ← JST 表示
    format.ts                ← duration / bytes / currency
    types.ts                 ← View 用の型エイリアス
```

**禁止**: `lib/` に backend ロジック（SQL、AMI、dialplan、業務 validation）を新規追加すること。REBUILD-PLAN §3.3 の単一正本に従い、`@openpbx/core` / `@openpbx/db` / `@openpbx/infra` を経由する。

### 8.2 命名規約

| 種類 | 命名 | 例 |
|------|------|-----|
| Page | `page.tsx`、関数名 `<Url>Page` | `/extensions/page.tsx` の `ExtensionsPage` |
| Server Action | `<verb><Resource>Action` | `createExtensionAction` |
| Route Handler | `route.ts`、export 名 `GET` / `POST` 等 | `/api/devices/stream/route.ts` |
| Client component | `kebab-case.tsx`、関数 PascalCase | `device-list.tsx` の `DeviceList` |
| 共通 component | `PascalCase.tsx` | `FlashBanner.tsx` |
| ViewModel 関数 | `build<X>ViewModel` | `buildExtensionsViewModel` |
| Helper（pure） | 動詞 + 名詞 | `formatJst`, `parseFlashUrl` |

### 8.3 Server Component vs Client Component の判断

| ケース | 種別 |
|--------|------|
| データ取得して表示するだけ | Server |
| `useState` / `useEffect` / `EventSource` / WebSocket | Client（最小単位で `'use client'`） |
| フォーム + Server Action | Server（form の `action={fooAction}` で十分） |
| 高頻度更新（SSE / WebRTC） | Client（ただし親は Server で auth check） |
| flash バナー（URL 監視） | Client（layout から呼ぶが Suspense で囲む） |

**ルール**: ページ全体を `'use client'` にしない。クライアント機能は小さなコンポーネントに切り出し、親は Server のまま。

### 8.4 フォームと Server Action の接続

```tsx
// 例: /extensions/page.tsx
import { createExtensionAction } from '@/app/actions';

<form action={createExtensionAction} className="space-y-3">
  <Field label="番号" name="number" required />
  <Field label="表示名" name="displayName" />
  <Field label="secret" name="secret" type="password" />
  <Field label="備考" name="note" />
  <label><input type="checkbox" name="webrtc" value="1" /> WebRTC 対応</label>
  <button type="submit" className="bg-blue-600 ...">追加</button>
</form>
```

- 検証は backend に任せる（フロントは HTML の `required` 程度）
- FormData のキー名は REBUILD-PLAN §2.5 と Server Action 実装に従う
- 成功・失敗時の redirect は Action 側で `redirect('/extensions?ok=...')` / `redirect('/extensions?err=...')`

### 8.5 共通 component の使い分け

| やりたいこと | 使うもの |
|-------------|---------|
| データなしの表示 | `<EmptyState>` |
| データ取得失敗 | `<ErrorState>` |
| 削除など破壊操作 | `<ConfirmButton confirmText="...">` |
| サマリーの数字 | `<Card label value hint href>` |
| フォーム 1 項目 | `<Field name label hint error>` |
| 表 | `<Table columns rows>`（行が多ければ sticky thead） |
| ページ上部の成功/失敗 | `FlashBanner`（layout で自動） |

### 8.6 ui-core / ui-react を分けるか？

REBUILD-PLAN 完了までは **`apps/web` 内で完結**でよい。`packages/ui-core` / `packages/ui-react` への切り出しは：

- 他アプリ（例: 別管理画面、CLI ダッシュボード）から再利用する需要が出たとき
- `apps/web` 外（Chrome 拡張など）から `formatJst` のような pure 関数を再利用したくなったとき

に行う。最初から workspace を分けるのは過剰。

---

## 9. a11y / i18n / 表示単位

### 9.1 a11y

- `<html lang="ja">` 必須
- ボタンには accessible name（visible text または `aria-label`）
- フォームフィールドは `<label>` でラップ、または `htmlFor`
- error は `role="alert"` または `aria-describedby` で input に紐付け
- success flash は `role="status"`
- ナビは `role="navigation"` + `aria-label="メインナビゲーション"`
- 表は `<th scope="col">`、行ヘッダ必要なら `<th scope="row">`
- focus ring を hidden で消さない（`focus:outline-none focus:ring-2 focus:ring-blue-500` を必ず付ける）
- 色だけで意味を伝えない（オンライン/オフラインは `●` / `○` も付ける）
- axe-core (`@axe-core/playwright`) を E2E に組み込み、クリティカル違反 0

### 9.2 i18n

- UI 文言は **日本語**
- 日付・時刻は **JST**（`Asia/Tokyo`）
- 数字は半角、3 桁区切り `1,234`
- エラー文言は技術用語を避ける（`unauthorized` ではなく `権限がありません`）
- 多言語対応はしない（必要になったら i18n ライブラリ導入を検討）

### 9.3 表示単位

| 種類 | 形式 | 例 |
|------|------|-----|
| 日時 | `YYYY-MM-DD HH:mm:ss`（JST） | `2026-05-19 09:30:00` |
| 日付のみ | `YYYY-MM-DD` | `2026-05-19` |
| 時刻のみ | `HH:mm` | `09:30` |
| 通話時間 | `mm:ss` または `H:mm:ss` | `01:23` |
| バイト | SI 単位 | `1.2 MB` |
| 通貨 | `¥` + 整数 3 桁区切り | `¥3,210` |
| 電話番号 | normalize 後の数字中心 | `0312345678` |
| 内線番号 | そのまま | `1001` |
| 空値 | `-`（ハイフン） | `-` |

### 9.4 長文・大量行の耐性

- 内線番号 6 桁・displayName 64 文字・note 256 文字でレイアウトが崩れない（CSS `min-w-0 truncate`、tooltip で全文）
- CDR テーブル 1000 行で破綻しない（virtualization は不要、`max-h-[60vh] overflow-y-auto` で十分）
- IVR options 10 行で破綻しない
- モバイル 360px 幅で主要ページが読める（横スクロール許容）

### 9.5 レスポンシブ

| ブレークポイント | 対応 |
|------------------|------|
| < 640px (sm 未満) | ナビ横スクロール、グリッド 1 列、テーブル横スクロール |
| 640〜768px (sm) | グリッド 2 列 |
| 768〜1024px (md) | グリッド 3〜4 列、本文 max-w-3xl |
| ≥ 1024px (lg) | グリッド 4 列、本文 max-w-5xl |

xl 以上は targets しない（`max-w-5xl` で十分）。

---

## 10. 契約への依存（REBUILD-PLAN 側で確定）

本書は以下を **正本としない**。すべて `docs/TDD-REBUILD-PLAN.md` から読む。

| 項目 | REBUILD-PLAN の場所 |
|------|---------------------|
| 22 ページ URL と認可 | §2.3 |
| 10 Route Handler | §2.4 |
| 40 Server Action と FormData | §2.5（実装は `apps/web/src/app/actions.ts`） |
| 認可・監査の原則 | §11 |
| 環境変数・ボリューム | §10 |
| inbox meta.json schema | §9.3 |
| domain validation | `@openpbx/core` |
| DB スキーマ | `@openpbx/db`（Phase 3） |

backend 側で contract が変わった時は、本書のワイヤーフレームと §7 ロール表を同 PR で更新する。

### 10.1 backend に依頼が必要な未確定事項

| # | 項目 | 必要な確定 |
|---|------|-----------|
| 1 | `/api/devices/stream` の snapshot event JSON 型 | `@openpbx/core` 型 export |
| 2 | `/api/originate` の request/response JSON 型 | 同上 |
| 3 | `/api/phonebook/lookup` の response JSON 型 | 同上 |
| 4 | `/api/cdr/ingest` の response JSON 型 | 同上 |
| 5 | `/api/guidances` POST の multipart 仕様（最大サイズ・許容 MIME） | 仕様文書化 |
| 6 | `getCurrentAccount` の返り値型 | Account 型 export |
| 7 | flash key と日本語文言のマッピング | フロント or backend どちらで持つか決定 |

---

## 11. 進め方とテストの最小ルール

### 11.1 推奨実装順

1. **AppShell（layout + middleware + NavBar + FlashBanner）** を先に固める
2. **共通 component**（Card / Field / Table / EmptyState / ErrorState / ConfirmButton）を作る
3. **読み取り系ページ**（`/`, `/cdr`, `/recordings`, `/concurrency`, `/audit`, `/devices`）
4. **書き込み系ページ**（`/extensions`, `/ring-groups`, `/pickup-groups`, `/phonebook`, `/business-hours`, `/ivr`, `/guidances`, `/billing`, `/accounts`, `/security`, `/trunks`, `/upgrades`, `/me`）
5. **クライアント機能**（`device-list.tsx` SSE、`softphone.tsx` WebRTC、TOTP QR）
6. **a11y / i18n の最終チェック**（axe-core CI、キーボード操作、長文・大量行）
7. **Chrome 拡張**（最小権限の MV3、tel: → originate）

### 11.2 テストの最小ルール（TDD 不要）

書くなら以下、書かなくてもよい。

- **書く価値があるもの**
  - 共通 component の RTL（FlashBanner / ConfirmButton / NavBar）
  - JST フォーマット・flash URL パーサのような pure helper（Vitest node）
  - middleware（NextRequest を生成して redirect/401 を確認）
  - Playwright で「ログイン → /extensions 作成 → flash 表示」の smoke 1〜2 本
- **書かなくてよいもの**
  - 全ページの DOM スナップショット
  - フォームの全フィールド × 全エラーの組合せ
  - sip.js / EventSource の完全 mock
- **絶対書かないもの**
  - backend のロジックを再実装したテスト（`@openpbx/core` のテストと重複）

backend の TDD ID（T-UI-*, T-E2E-*）に該当するものは REBUILD-PLAN 側で書かれる。フロントは backend が定義した契約に従って画面を作るだけ。

### 11.3 完了の定義

1. `docker compose up` 後、admin で `/login` → `/extensions` 新規作成 → `/devices` で SSE 反映 → `/softphone` 登録までが手動で通る
2. user / supervisor / admin それぞれでログインし、§7 のロール別表示マトリクスが守られている
3. axe-core クリティカル違反 0
4. 360px 幅・1280px 幅の両方で主要 5 画面（`/`, `/login`, `/extensions`, `/cdr`, `/me`）が破綻しない
5. `apps/web/src/lib/` に backend ロジックの新規追加が無い（既存 legacy spec は REBUILD-PLAN の wire 完了で消える想定）

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-05-19 | 初版: TDD 枠を外し、REBUILD-PLAN と重複しないデザイン＋実装ガイドとして書き起こし。22 画面のワイヤー込み |
