import { describe, expect, it } from 'vitest';
import { asteriskHttpConfIsLoopbackOnly } from '../asterisk/http-bind.js';

describe('T-SEC-A05-001: asterisk http loopback bind', () => {
  it('Given loopback http.conf When check Then true', () => {
    const conf = `[general]
bindaddr=127.0.0.1
tlsbindaddr=127.0.0.1:8089
`;
    expect(asteriskHttpConfIsLoopbackOnly(conf)).toBe(true);
  });

  it('Given 0.0.0.0 bind When check Then false', () => {
    expect(asteriskHttpConfIsLoopbackOnly('bindaddr=0.0.0.0\n')).toBe(false);
  });
});
