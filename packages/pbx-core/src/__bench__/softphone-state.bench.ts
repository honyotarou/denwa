import { bench, describe } from 'vitest';
import {
  nextStateOnDialClick,
  nextStateOnHangup,
  nextStateOnRegisterClick,
  softphoneStatusLabel,
  validateDialTarget,
} from '../softphone/state.js';

describe('softphone state machine bench', () => {
  bench('nextStateOnRegisterClick', () => {
    nextStateOnRegisterClick('disconnected');
  });

  bench('nextStateOnDialClick', () => {
    nextStateOnDialClick('registered');
  });

  bench('nextStateOnHangup', () => {
    nextStateOnHangup('inCall');
  });

  bench('validateDialTarget valid', () => {
    validateDialTarget('1002');
  });

  bench('validateDialTarget invalid', () => {
    validateDialTarget('bad');
  });

  bench('softphoneStatusLabel', () => {
    softphoneStatusLabel('registered');
  });
});
