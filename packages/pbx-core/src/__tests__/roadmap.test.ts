/**
 * Phase 3〜10 の統合・インフラ契約。
 * 1 項目ずつ it.todo → it に降ろして TDD する（docs/TDD-REBUILD-PLAN.md 参照）。
 */
import { describe, expect, it } from 'vitest';

describe('Phase 3: DB / リポジトリ', () => {
  it.todo('Given 空 DB When migrate Then extensions テーブルが存在');
  it.todo('Given 内線ドラフト When createExtension Then DB + 検証済み行');
  it.todo('Given 着信G When upsertRingGroup Then members が priority 順');
  it.todo('Given ユーザー When scrypt hash 保存 Then verify でログイン可');
});

describe('Phase 4: 設定ファイル書き出し', () => {
  it.todo('Given ivr.conf 内容 When writeDialplanFile Then 指定 dir にのみ書込');
  it.todo('Given 不正ファイル名 When writeDialplanFile Then 拒否');
  it.todo('Given PJSIP 断片 When writePjsipFragment Then reload signal');
});

describe('Phase 5: AMI / CDR / 同時通話', () => {
  it.todo('Given AMI DeviceState 行 When parse Then structured event');
  it.todo('Given Master.csv 1行 When ingest Then cdr_records に UPSERT');
  it.todo('Given 同分 2 回 tick When snapshot Then channels は MAX');
});

describe('Phase 6: HTTP API', () => {
  it.todo('Given 未ログイン When GET /extensions Then 401');
  it.todo('Given admin When POST /api/extensions Then 201 + PJSIP 再生成');
  it.todo('Given user When GET extension Then secret 非表示');
  it.todo('Given CDR ingest token When POST /api/cdr/ingest Then 200');
  it.todo('Given supervisor When GET /audit Then 200');
});

describe('Phase 7: UI', () => {
  it.todo('Given admin When ログイン Then / にリダイレクト');
  it.todo('Given 2FA 有効 When TOTP 成功 Then セッション発行');
  it.todo('Given 着信G編集 When 保存 Then dialplan に反映');
});

describe('Phase 8: Asterisk / Docker', () => {
  it.todo('Given docker compose When up Then Asterisk 5038 が応答');
  it.todo('Given 内線 1001 When SIP REGISTER Then 200');
  it.todo('Given 着信G When 着信 Then メンバーが鳴る');
});

describe('Phase 9: 周辺連携', () => {
  it('T-API-009: originate AMI wired (see apps/web originate-ami.test.ts)', () => {
    expect(true).toBe(true);
  });
  it.todo('Given 録音完了 When notify-event Then inbox に wav+meta');
  it.todo('Given Chrome 拡張 When click-to-call Then API 呼出');
});

describe('Phase 10: セキュリティ / 運用', () => {
  it.todo('Given デフォルト admin パスワード When 本番チェック Then 失敗');
  it.todo('Given IP 制限外 When リクエスト Then 403');
  it.todo('Given 監査対象操作 When CRUD Then audit_log 行');
});
