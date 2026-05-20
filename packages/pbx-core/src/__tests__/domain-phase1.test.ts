/**
 * §7 Domain Phase 1 契約（T-EXT 〜 T-ORIG のうち @openpbx/core 正本）
 * 既存 describe と重複する ID はここで T-XXX 形式を正とする。
 */
import { describe, expect, it } from 'vitest';
import { canViewAudit, extensionForRole } from '../auth/access.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import {
  DEFAULT_PASSWORD_POLICY,
  isIpAllowed,
  validatePasswordAgainstPolicy,
} from '../auth/policy.js';
import {
  base32Decode,
  base32Encode,
  buildOtpauthUri,
  generateTotp,
  verifyTotp,
} from '../auth/totp.js';
import { billingRowCost, computeCallCost, pickRateForDst } from '../billing/cost.js';
import { asteriskToDays, daysToAsterisk } from '../business-hours/days.js';
import { renderBusinessHoursDialplan } from '../business-hours/dialplan.js';
import {
  validateHolidayDate,
  validateHolidayName,
  validateTimeRuleDraft,
} from '../business-hours/validate.js';
import {
  cdrParsedRowFromCsvLine,
  cdrRowFromCsvLine,
  parseCdrCsvLine,
} from '../cdr/csv.js';
import { assertDialplanFilename, validateDialplanFilename } from '../dialplan/filename.js';
import {
  normalizeExtensionDraft,
  validateExtensionDraft,
  validateExtensionNumber,
  validateExtensionSecret,
} from '../extension.js';
import { validateGuidanceName, validateWavHeader } from '../guidance/validate.js';
import { buildInboxMeta } from '../inbox/meta.js';
import { renderIvrDialplan } from '../ivr/dialplan.js';
import { validateIvrMenuDraft } from '../ivr/validate.js';
import { buildOriginateAction, validateOriginateRequest } from '../originate/ami.js';
import { lookupPhonebook } from '../phonebook/lookup.js';
import {
  normalizePhonebookNumber,
  validatePhonebookDraft,
} from '../phonebook/validate.js';
import { renderPickupDialplan } from '../pickup/dialplan.js';
import { validatePickupGroupDraft } from '../pickup/validate.js';
import { renderPjsipExtensions, renderPjsipExtensionsIfValid } from '../pjsip.js';
import { renderRingGroupDialplan, validateRingGroupDraft } from '../ring-group.js';
import { renderTrunksDialplan } from '../trunk/dialplan.js';
import { renderTrunksPjsip, renderTrunksPjsipIfValid } from '../trunk/pjsip.js';
import { validateTrunkDraft } from '../trunk/validate.js';
import { validateUpgradeDraft } from '../upgrade/validate.js';

const CDR_LINE =
  '"","1001","9000","internal","","","","Dial","","t1","t2","t3","60","55","ANSWERED","","","uid-1"';

describe('T-EXT / T-PJSIP', () => {
  it('T-EXT-001: Given 1001 When validateExtensionNumber Then ok', () => {
    expect(validateExtensionNumber('1001')).toBeNull();
  });
  it('T-EXT-002: Given 1 桁 When validateExtensionNumber Then error', () => {
    expect(validateExtensionNumber('1')).not.toBeNull();
  });
  it('T-EXT-003: Given 4 文字 secret When validateExtensionSecret Then ok', () => {
    expect(validateExtensionSecret('abcd')).toBeNull();
  });
  it('T-EXT-004: Given quote in secret When validateExtensionSecret Then error', () => {
    expect(validateExtensionSecret('a"b')).not.toBeNull();
  });
  it('T-EXT-005: Given 正常 draft When validateExtensionDraft Then 空', () => {
    expect(
      validateExtensionDraft({
        number: '1001',
        displayName: 'A',
        secret: 'secret',
        webrtc: false,
        pickupGroupNames: [],
      }),
    ).toEqual([]);
  });
  it('T-EXT-006: Given webrtc true When normalizeExtensionDraft Then boolean', () => {
    expect(normalizeExtensionDraft({ number: '1001', secret: 'x', webrtc: true }).webrtc).toBe(
      true,
    );
  });
  it('T-EXT-007: Given 空 display When normalizeExtensionDraft Then null', () => {
    expect(
      normalizeExtensionDraft({ number: '1001', secret: 'x', displayName: '  ' }).displayName,
    ).toBeNull();
  });
  it('T-PJSIP-005: Given invalid secret When renderPjsipExtensionsIfValid Then null', () => {
    expect(
      renderPjsipExtensionsIfValid([
        { number: '1', displayName: null, secret: 'x', webrtc: false, pickupGroupNames: [] },
      ]),
    ).toBeNull();
  });
});

describe('T-RG', () => {
  it('T-RG-005: Given linear と priority 順 members When render Then Dial 順序が保持', () => {
    const out = renderRingGroupDialplan(
      [
        {
          number: '6003',
          name: null,
          strategy: 'linear',
          ringSeconds: 20,
          fallbackExtension: null,
          members: ['1002', '1001'],
        },
      ],
      { updatedAt: 'fixed' },
    );
    const i1 = out.indexOf('Dial(PJSIP/1002');
    const i2 = out.indexOf('Dial(PJSIP/1001');
    expect(i1).toBeGreaterThan(-1);
    expect(i2).toBeGreaterThan(i1);
  });
  it('T-RG-006: Given fallback When render Then Goto fallback', () => {
    const out = renderRingGroupDialplan(
      [
        {
          number: '6001',
          name: null,
          strategy: 'ringall',
          ringSeconds: 25,
          fallbackExtension: '1000',
          members: ['1001'],
        },
      ],
      { updatedAt: 'fixed' },
    );
    expect(out).toContain('Goto(internal,1000,1)');
  });
});

describe('T-CDR', () => {
  it('T-CDR-001: Given quoted comma When parseCdrCsvLine Then 分割されない', () => {
    expect(parseCdrCsvLine('"a,b",c')).toEqual(['a,b', 'c']);
  });
  it('T-CDR-003/005/006: Given 18 fields When parse Then 数値と null 日時', () => {
    const row = cdrParsedRowFromCsvLine(CDR_LINE);
    expect(row!.uniqueid).toBe('uid-1');
    expect(row!.durationSec).toBe(60);
    expect(cdrRowFromCsvLine(CDR_LINE)).not.toBeNull();
  });
});

describe('T-AUTH / T-TOTP', () => {
  it('T-AUTH-001/002: Given hash When verify Then true/false', () => {
    const h = hashPassword('pw');
    expect(verifyPassword('pw', h)).toBe(true);
    expect(verifyPassword('no', h)).toBe(false);
  });
  it('T-AUTH-003: Given 短い password When validate Then エラー', () => {
    expect(validatePasswordAgainstPolicy('Ab1', DEFAULT_PASSWORD_POLICY).length).toBeGreaterThan(
      0,
    );
  });
  it('T-TOTP-001: Given 同時刻 When verifyTotp Then true', () => {
    const t = 1_700_000_000_000;
    const code = generateTotp('JBSWY3DPEHPK3PXP', t);
    expect(verifyTotp('JBSWY3DPEHPK3PXP', code, t)).toBe(true);
  });
});

describe('T-BILL / T-BH / T-IVR / T-TRUNK', () => {
  it('T-BILL-001: Given 03 prefix When pickRateForDst Then 最長一致', () => {
    expect(
      pickRateForDst('0312', [
        { prefix: '0', perMin: 10, setupFee: 0 },
        { prefix: '03', perMin: 3, setupFee: 0 },
      ])?.prefix,
    ).toBe('03');
  });
  it('T-BH-007: Given start >= end When validateTimeRuleDraft Then error', () => {
    expect(
      validateTimeRuleDraft({
        name: 'bad',
        days: 'mon-fri',
        startTime: '18:00',
        endTime: '09:00',
      }),
    ).toContain('開始時刻は終了より前');
  });
  it('T-BH-010: Given 2 rules When render Then 名前順 GotoIfTime', () => {
    const out = renderBusinessHoursDialplan(
      [
        { name: 'z-late', days: 'sat', startTime: '10:00', endTime: '12:00' },
        { name: 'a-early', days: 'mon-fri', startTime: '09:00', endTime: '18:00' },
      ],
      [],
      { updatedAt: 'fixed' },
    );
    const mon = out.indexOf('mon-fri');
    const sat = out.indexOf('sat');
    expect(mon).toBeGreaterThan(-1);
    expect(sat).toBeGreaterThan(-1);
    expect(mon).toBeLessThan(sat);
  });
  it('T-IVR-010: Given options 空 When validate Then error', () => {
    expect(
      validateIvrMenuDraft({
        number: '5000',
        name: null,
        welcomePrompt: null,
        menuPrompt: null,
        invalidPrompt: null,
        goodbyePrompt: null,
        maxRetries: 3,
        waitSeconds: 5,
        options: [],
      }),
    ).toContain('options は 1 件以上');
  });
  it('T-TRUNK-005: Given registration false When renderPjsip Then registration なし', () => {
    const out = renderTrunksPjsip(
      [
        {
          name: 't1',
          host: 'h.example.com',
          port: 5060,
          username: 'u',
          secret: 'p',
          registration: false,
          fromUser: null,
          fromDomain: null,
          didInbound: null,
          outboundPrefix: null,
        },
      ],
      { updatedAt: 'fixed' },
    );
    expect(out).not.toContain('type=registration');
  });
  it('T-TRUNK-010: Given unsafe secret When renderTrunksPjsipIfValid Then null', () => {
    expect(
      renderTrunksPjsipIfValid([
        {
          name: 'bad',
          host: 'h',
          port: 5060,
          username: 'u',
          secret: 'a"b',
          registration: false,
          fromUser: null,
          fromDomain: null,
          didInbound: null,
          outboundPrefix: null,
        },
      ]),
    ).toBeNull();
  });
});

describe('T-PICKUP / T-PB / T-DP / T-GUID / T-UPG / T-ORIG', () => {
  it('T-PICKUP-004: Given render When pickup Then *8', () => {
    expect(renderPickupDialplan({ updatedAt: 'fixed' })).toContain('Pickup()');
  });
  it('T-PB-006: Given 正規化番号 When lookupPhonebook Then hit', () => {
    const entries = [{ name: 'A', number: '0312345678' }];
    expect(lookupPhonebook('03 (1234) 5678', entries)?.name).toBe('A');
    expect(normalizePhonebookNumber('03 (1234) 5678')).toBe('0312345678');
  });
  it('T-DP-002: Given ../evil When validateDialplanFilename Then error', () => {
    expect(validateDialplanFilename('../evil.conf')).not.toBeNull();
  });
  it('T-GUID-004: Given RIFF wav When validateWavHeader Then ok', () => {
    const riff = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
    expect(validateWavHeader(riff)).toBeNull();
    expect(validateGuidanceName('custom/welcome')).toBeNull();
  });
  it('T-UPG-001: Given ISO When validateUpgradeDraft Then ok', () => {
    expect(
      validateUpgradeDraft({
        scheduledAt: '2026-05-20T10:00:00Z',
        asteriskImage: 'asterisk:22',
      }),
    ).toEqual([]);
  });
  it('T-ORIG-004: Given callerId When buildOriginateAction Then AMI fields', () => {
    const fields = buildOriginateAction({
      from: '1001',
      to: '1002',
      callerId: 'Test <1001>',
    });
    expect(fields.Channel).toBe('PJSIP/1001');
    expect(fields.Exten).toBe('1002');
    expect(fields.CallerID).toBe('Test <1001>');
    expect(validateOriginateRequest({ from: '1', to: '1002' })).not.toEqual([]);
  });
});
