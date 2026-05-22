import { describe, expect, it } from 'vitest';
import { normalizeClickToCallNumber } from '../click2call/phone.js';
import { validateFlowGraph } from '../triage/validate.js';
import { buildTriageSummary } from '../triage/summary.js';
import {
  nextStateOnRegisterClick,
  nextStateOnRegisterOk,
  softphoneStatusLabel,
  validateDialTarget,
} from '../softphone/state.js';
import { validatePatientId } from '../patients/validate.js';

describe('OpenPBX gap — core contracts', () => {
  it('T-CHX-001: tel link normalization', () => {
    expect(normalizeClickToCallNumber('tel:03-1234-5678')).toBe('0312345678');
  });

  it('T-TRIAGE-001: flow graph validates', () => {
    expect(validateFlowGraph()).toEqual([]);
  });

  it('T-TRIAGE-006: urgent in summary', () => {
    const s = buildTriageSummary({
      history: [{ questionText: 'Q', answerLabel: 'A', flag: 'urgent' }],
      endText: null,
      recommendations: [],
    });
    expect(s).toContain('⚠️');
  });

  it('T-SOFT-005: register click', () => {
    expect(nextStateOnRegisterClick('disconnected')).toBe('registering');
    expect(nextStateOnRegisterOk()).toBe('registered');
  });

  it('T-SOFT-004: dial target', () => {
    expect(validateDialTarget('1002')).toBeNull();
    expect(validateDialTarget('x')).not.toBeNull();
  });

  it('T-SOFT-004b: status label (OpenPBX 互換)', () => {
    expect(softphoneStatusLabel('registered')).toBe('登録完了');
    expect(softphoneStatusLabel('inCall')).toBe('通話中');
  });

  it('T-PAT-001: patient id', () => {
    expect(validatePatientId('12345')).toBeNull();
  });
});
