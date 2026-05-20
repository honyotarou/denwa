import { describe, expect, it } from 'vitest';
import {
  validateBirthDate,
  validatePatientId,
  validateRecordKind,
  validateUpsertPatientInput,
  validateCreatePatientRecordInput,
} from '../patients/validate.js';

describe('T-PAT: patient validation', () => {
  it('T-PAT-001: Given 12345 When validatePatientId Then ok', () => {
    expect(validatePatientId('12345')).toBeNull();
  });

  it('T-PAT-002: Given 1234 / abcde When validatePatientId Then error', () => {
    expect(validatePatientId('1234')).not.toBeNull();
    expect(validatePatientId('abcde')).not.toBeNull();
  });

  it('T-PAT-003: Given 2026-05-20 When validateBirthDate Then ok', () => {
    expect(validateBirthDate('2026-05-20')).toBeNull();
  });

  it('T-PAT-004: Given 2026/05/20 When validateBirthDate Then error', () => {
    expect(validateBirthDate('2026/05/20')).not.toBeNull();
  });

  it('T-PAT-005: Given triage When validateRecordKind Then ok', () => {
    expect(validateRecordKind('triage')).toBeNull();
  });

  it('T-PAT-006: Given diagnosis When validateRecordKind Then error', () => {
    expect(validateRecordKind('diagnosis')).not.toBeNull();
  });

  it('T-PAT-001b: validateUpsertPatientInput aggregates errors', () => {
    expect(validateUpsertPatientInput({ id: '12', birthDate: 'bad' }).length).toBeGreaterThan(0);
  });

  it('T-PAT-005b: validateCreatePatientRecordInput kind', () => {
    expect(validateCreatePatientRecordInput({ patientId: '12345', kind: 'note' })).toEqual([]);
  });
});
