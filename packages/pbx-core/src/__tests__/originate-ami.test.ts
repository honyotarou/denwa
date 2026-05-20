import { describe, expect, it } from 'vitest';
import { buildOriginateAction, validateOriginateRequest } from '../originate/ami.js';

describe('T-SEC-AMI-001: originate AMI header validation', () => {
  it('Given CRLF in callerId When validate Then error', () => {
    expect(
      validateOriginateRequest({ from: '1001', to: '1002', callerId: 'x\r\nAction: Command' }),
    ).not.toEqual([]);
  });

  it('Given disallowed context When validate Then error', () => {
    expect(validateOriginateRequest({ from: '1001', to: '1002', context: 'from-trunk' })).not.toEqual(
      [],
    );
  });

  it('Given safe callerId When buildOriginateAction Then CallerID set', () => {
    const fields = buildOriginateAction({
      from: '1001',
      to: '1002',
      callerId: 'Desk 1001',
    });
    expect(fields.CallerID).toBe('Desk 1001');
  });
});
