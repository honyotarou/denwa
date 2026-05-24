import path from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { resolveDatabaseFile } from '../database-path';

describe('T-DB-PATH-001: resolveDatabaseFile', () => {
  const prev = process.env.DATABASE_PATH;

  afterEach(() => {
    if (prev === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = prev;
  });

  it('Given DATABASE_PATH When resolve Then env wins', () => {
    process.env.DATABASE_PATH = '/tmp/custom.sqlite';
    expect(resolveDatabaseFile('/any/cwd')).toBe('/tmp/custom.sqlite');
  });

  it('Given apps/web cwd When resolve Then repo data/db', () => {
    delete process.env.DATABASE_PATH;
    const cwd = path.join('/repo', 'apps', 'web');
    expect(resolveDatabaseFile(cwd)).toBe(path.join('/repo', 'data/db/command-room.sqlite'));
  });

  it('Given repo root cwd When resolve Then data/db under cwd', () => {
    delete process.env.DATABASE_PATH;
    expect(resolveDatabaseFile('/repo')).toBe('/repo/data/db/command-room.sqlite');
  });
});
