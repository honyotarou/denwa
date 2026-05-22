import { describe, expect, it } from 'vitest';
import {
  nextStateOnDialClick,
  nextStateOnHangup,
  nextStateOnIncoming,
  nextStateOnRegisterClick,
  nextStateOnRegisterFail,
  nextStateOnRegisterOk,
  nextStateOnUnregister,
  softphoneStatusLabel,
  validateDialTarget,
  type SoftphoneUiState,
} from '../softphone/state.js';

const ALL_STATES: SoftphoneUiState[] = [
  'disconnected',
  'registering',
  'registered',
  'incoming',
  'inCall',
  'error',
];

describe('softphone state machine (T-SOFT)', () => {
  it('T-SOFT-005: register click from disconnected/error → registering', () => {
    expect(nextStateOnRegisterClick('disconnected')).toBe('registering');
    expect(nextStateOnRegisterClick('error')).toBe('registering');
  });

  it('T-SOFT-005b: register click ignored when already active', () => {
    for (const s of ['registering', 'registered', 'incoming', 'inCall'] as const) {
      expect(nextStateOnRegisterClick(s)).toBe(s);
    }
  });

  it('T-SOFT-006: register ok → registered', () => {
    expect(nextStateOnRegisterOk()).toBe('registered');
  });

  it('T-SOFT-007: register fail → error', () => {
    expect(nextStateOnRegisterFail()).toBe('error');
  });

  it('T-SOFT-008: dial from registered → inCall', () => {
    expect(nextStateOnDialClick('registered')).toBe('inCall');
  });

  it('T-SOFT-008b: dial ignored unless registered', () => {
    for (const s of ['disconnected', 'registering', 'incoming', 'inCall', 'error'] as const) {
      expect(nextStateOnDialClick(s)).toBe(s);
    }
  });

  it('T-SOFT-009: incoming → incoming state', () => {
    expect(nextStateOnIncoming()).toBe('incoming');
  });

  it('T-SOFT-010/011: hangup from inCall/incoming → registered', () => {
    expect(nextStateOnHangup('inCall')).toBe('registered');
    expect(nextStateOnHangup('incoming')).toBe('registered');
  });

  it('T-SOFT-011b: hangup no-op otherwise', () => {
    for (const s of ['disconnected', 'registering', 'registered', 'error'] as const) {
      expect(nextStateOnHangup(s)).toBe(s);
    }
  });

  it('T-SOFT-014: unregister → disconnected', () => {
    for (const s of ALL_STATES) {
      expect(nextStateOnUnregister(s)).toBe('disconnected');
    }
  });
});

describe('validateDialTarget (T-SOFT-004)', () => {
  it('accepts 2–6 digit targets', () => {
    expect(validateDialTarget('10')).toBeNull();
    expect(validateDialTarget('1002')).toBeNull();
    expect(validateDialTarget('123456')).toBeNull();
  });

  it('rejects empty, non-digit, too short/long', () => {
    expect(validateDialTarget('')).not.toBeNull();
    expect(validateDialTarget('   ')).not.toBeNull();
    expect(validateDialTarget('1')).not.toBeNull();
    expect(validateDialTarget('1234567')).not.toBeNull();
    expect(validateDialTarget('10a2')).not.toBeNull();
    expect(validateDialTarget('x')).not.toBeNull();
  });

  it('trims whitespace before validation', () => {
    expect(validateDialTarget('  1002  ')).toBeNull();
  });
});

describe('softphoneStatusLabel (OpenPBX 互換)', () => {
  it('maps every state to Japanese label', () => {
    expect(softphoneStatusLabel('disconnected')).toBe('未接続');
    expect(softphoneStatusLabel('registering')).toBe('接続中…');
    expect(softphoneStatusLabel('registered')).toBe('登録完了');
    expect(softphoneStatusLabel('incoming')).toBe('着信中');
    expect(softphoneStatusLabel('inCall')).toBe('通話中');
    expect(softphoneStatusLabel('error')).toBe('エラー');
  });
});
