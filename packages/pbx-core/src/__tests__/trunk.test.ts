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
  it('Given 正常 trunk When validate Then 空', () => {
    expect(validateTrunkDraft(trunk)).toEqual([]);
  });

  it('Given 不正 port When validate Then エラー', () => {
    expect(validateTrunkDraft({ ...trunk, port: 0 })).toContain('port は 1-65535');
  });
});

describe('Trunk PJSIP 生成', () => {
  it('Given trunk When render Then endpoint と registration', () => {
    const out = renderTrunksPjsip([trunk], { updatedAt: 'fixed' });
    expect(out).toContain('[carrier-a]');
    expect(out).toContain('type=registration');
    expect(out).toContain('contact=sip:sip.example.com:5060');
  });
});

describe('Trunk dialplan 生成', () => {
  it('Given DID When render Then inbound Goto', () => {
    const out = renderTrunksDialplan([trunk], { updatedAt: 'fixed' });
    expect(out).toContain('exten => 0312345678,1');
    expect(out).toContain('Goto(internal,0312345678,1)');
  });

  it('Given outboundPrefix When render Then Dial PJSIP', () => {
    const out = renderTrunksDialplan([trunk], { updatedAt: 'fixed' });
    expect(out).toContain('Dial(PJSIP/${EXTEN}@carrier-a,60)');
  });
});
