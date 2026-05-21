import { describe, expect, it } from 'vitest';
import { renderTrunksDialplan } from '../trunk/dialplan.js';
import { renderTrunksPjsip } from '../trunk/pjsip.js';
import { validateTrunkDraft } from '../trunk/validate.js';

const trunk = {
  name: 'carrier-a',
  host: 'sip.example.com',
  port: 5060,
  username: 'user',
  secret: 'pass',
  registration: true,
  fromUser: null,
  fromDomain: null,
  didInbound: '0312345678',
  outboundPrefix: '0',
};

describe('Trunk バリデーション', () => {
  it('T-TRUNK-001: Given 正常 trunk When validate Then 空', () => {
    expect(validateTrunkDraft(trunk)).toEqual([]);
  });

  it('T-TRUNK-002: Given 不正 port When validate Then エラー', () => {
    expect(validateTrunkDraft({ ...trunk, port: 0 })).toContain('port は 1-65535');
  });

  it('T-TRUNK-003: Given name unsafe When validate Then エラー', () => {
    expect(validateTrunkDraft({ ...trunk, name: 'bad name!' })).toContain(
      'name は 1-32 文字、英数 / _ / -',
    );
  });
});

describe('Trunk PJSIP 生成', () => {
  it('T-TRUNK-004: Given registration true When render Then registration block', () => {
    const out = renderTrunksPjsip([trunk], { updatedAt: 'fixed' });
    expect(out).toContain('type=registration');
  });

  it('T-TRUNK-005: Given registration false When render Then registration なし', () => {
    const out = renderTrunksPjsip([{ ...trunk, registration: false }], { updatedAt: 'fixed' });
    expect(out).not.toContain('type=registration');
  });

  it('T-TRUNK-008: Given trunk When render Then auth section', () => {
    const out = renderTrunksPjsip([trunk], { updatedAt: 'fixed' });
    expect(out).toContain('[carrier-a-auth]');
    expect(out).toContain('password=pass');
  });

  it('T-TRUNK-009: Given from_user/domain When render Then from fields', () => {
    const out = renderTrunksPjsip(
      [{ ...trunk, fromUser: '050', fromDomain: 'example.com' }],
      { updatedAt: 'fixed' },
    );
    expect(out).toContain('from_user=050');
    expect(out).toContain('from_domain=example.com');
  });
});

describe('Trunk dialplan 生成', () => {
  it('T-TRUNK-006: Given DID When render Then inbound Goto', () => {
    const out = renderTrunksDialplan([trunk], { updatedAt: 'fixed' });
    expect(out).toContain('exten => 0312345678,1');
    expect(out).toContain('Goto(internal,0312345678,1)');
  });

  it('T-TRUNK-007: Given outboundPrefix When render Then Dial PJSIP', () => {
    const out = renderTrunksDialplan([trunk], { updatedAt: 'fixed' });
    expect(out).toContain('Dial(PJSIP/${EXTEN}@carrier-a,60)');
  });
});
