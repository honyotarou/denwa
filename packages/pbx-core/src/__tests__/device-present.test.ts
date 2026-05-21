import { describe, expect, it } from 'vitest';
import {
  deviceActivityDisplayLabel,
  reconcileStateWithReachability,
  registrationDisplayLabel,
  resolveContactReachable,
} from '../home/device-present.js';

describe('T-HOME-DEV-002: resolveContactReachable', () => {
  it('Given Reachable When resolve Then true', () => {
    expect(resolveContactReachable('Reachable')).toBe(true);
    expect(resolveContactReachable('Created')).toBe(true);
  });

  it('Given Unreachable When resolve Then false', () => {
    expect(resolveContactReachable('Unreachable')).toBe(false);
    expect(resolveContactReachable('Removed')).toBe(false);
  });
});

describe('T-HOME-DEV-002: reconcileStateWithReachability', () => {
  it('Given reachable true and unavailable When reconcile Then not_inuse', () => {
    expect(reconcileStateWithReachability('unavailable', true)).toBe('not_inuse');
  });

  it('Given reachable false and not_inuse When reconcile Then unavailable', () => {
    expect(reconcileStateWithReachability('not_inuse', false)).toBe('unavailable');
  });

  it('Given reachable false and inuse When reconcile Then inuse unchanged', () => {
    expect(reconcileStateWithReachability('inuse', false)).toBe('inuse');
  });
});

describe('T-HOME-DEV-002: deviceActivityDisplayLabel', () => {
  it('Given unavailable without contact When label Then オフライン', () => {
    expect(deviceActivityDisplayLabel('unavailable', null)).toBe('オフライン');
  });

  it('Given unavailable and unreachable When label Then 到達不可', () => {
    expect(deviceActivityDisplayLabel('unavailable', false)).toBe('到達不可');
  });

  it('Given not_inuse When label Then 待機中', () => {
    expect(deviceActivityDisplayLabel('not_inuse', true)).toBe('待機中');
  });
});

describe('T-HOME-DEV-002: registrationDisplayLabel', () => {
  it('Given reachable true When label Then registered marker', () => {
    expect(registrationDisplayLabel(true)).toBe('● 登録');
  });

  it('Given reachable false or null When label Then unregistered marker', () => {
    expect(registrationDisplayLabel(false)).toBe('○ 未登録');
    expect(registrationDisplayLabel(null)).toBe('○ 未登録');
  });
});
