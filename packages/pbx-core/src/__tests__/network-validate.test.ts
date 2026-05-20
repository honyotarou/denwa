import { describe, expect, it } from 'vitest';
import { renderPjsipTransportsConf } from '../network/transport-render.js';
import {
  normalizeLocalNetCsv,
  normalizeNetworkSettingsDraft,
  validateCidr,
  validateIpv4,
} from '../network/validate.js';

describe('T-NET: network settings validation', () => {
  it('T-NET-001: Given 100.64.1.23 When validateIpv4 Then ok', () => {
    expect(validateIpv4('100.64.1.23')).toBeNull();
  });

  it('T-NET-002: Given 999.1.1.1 When validateIpv4 Then error', () => {
    expect(validateIpv4('999.1.1.1')).not.toBeNull();
  });

  it('T-NET-003: Given localNet csv When normalize Then trim + stable', () => {
    expect(normalizeLocalNetCsv(' 192.168.0.0/16 , 100.64.0.0/10 ')).toBe(
      '100.64.0.0/10,192.168.0.0/16',
    );
  });

  it('T-NET-004: Given /33 When validateCidr Then error', () => {
    expect(validateCidr('192.168.0.0/33')).not.toBeNull();
  });

  it('T-NET-005: Given externalIp only When normalize Then signaling fallback', () => {
    expect(normalizeNetworkSettingsDraft({ externalIp: '100.64.1.23' })).toEqual({
      externalIp: '100.64.1.23',
      externalSignalingIp: '100.64.1.23',
      localNet: null,
    });
  });
});

describe('T-NET transport render', () => {
  it('T-NET-006: Given local nets When render Then multiple local_net lines', () => {
    const text = renderPjsipTransportsConf({
      settings: normalizeNetworkSettingsDraft({
        externalIp: '100.64.1.23',
        localNet: '192.168.0.0/16,100.64.0.0/10',
      }),
    });
    expect(text).toContain('local_net=192.168.0.0/16');
    expect(text).toContain('local_net=100.64.0.0/10');
  });

  it('T-NET-007: Given unsafe value When render Then null', () => {
    expect(
      renderPjsipTransportsConf({
        settings: { externalIp: 'evil\nline', externalSignalingIp: null, localNet: null },
      }),
    ).toBeNull();
  });
});
