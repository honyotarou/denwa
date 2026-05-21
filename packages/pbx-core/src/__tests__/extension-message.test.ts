import { describe, expect, it } from 'vitest';
import { parseOriginateContentMessage, CLICK2CALL_MSG_ORIGINATE } from '../click2call/extension-message.js';

describe('T-CHX G5 extension message', () => {
  it('Given valid originate When parse Then ok', () => {
    expect(parseOriginateContentMessage({ type: CLICK2CALL_MSG_ORIGINATE, to: '0312345678' })).toEqual({
      type: 'originate',
      to: '0312345678',
    });
  });

  it('Given invalid When parse Then null', () => {
    expect(parseOriginateContentMessage({ type: 'other' })).toBeNull();
    expect(parseOriginateContentMessage(null)).toBeNull();
  });
});
