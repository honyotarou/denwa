import { describe, expect, it } from 'vitest';
import { executeScheduledUpgrade, runComposeInRepo } from '../upgrades/compose-exec.js';

describe('T-UPG-EXEC-002: compose exec', () => {
  it('Given mock spawn When execute Then pull then up', () => {
    const calls: string[][] = [];
    const spawn = (_cmd: string, args: readonly string[]) => {
      calls.push([...args]);
      return { status: 0, stdout: 'ok', stderr: '' };
    };
    const row = { id: 1, scheduledAt: '2020-01-01T00:00:00Z', asteriskImage: 'ast:1' };
    const r = executeScheduledUpgrade('/repo', row, spawn);
    expect(r.ok).toBe(true);
    expect(calls[0]).toEqual(['compose', 'pull']);
    expect(calls[1]?.slice(0, 3)).toEqual(['compose', 'up', '-d']);
  });

  it('Given pull fail When execute Then abort', () => {
    const spawn = (_c: string, args: readonly string[]) => ({
      status: args.includes('pull') ? 1 : 0,
      stdout: '',
      stderr: 'fail',
    });
    const r = executeScheduledUpgrade('/repo', { id: 1, scheduledAt: 't', asteriskImage: 'x' }, spawn);
    expect(r.ok).toBe(false);
  });

  it('Given args When runComposeInRepo Then docker compose prefix', () => {
    const spawn = (_c: string, args: readonly string[]) => {
      expect(args[0]).toBe('compose');
      expect(args[1]).toBe('pull');
      return { status: 0 };
    };
    runComposeInRepo('/r', ['pull'], spawn);
  });
});
