import path from 'node:path';

/** 単一正本: dev は repo root の data/db、apps/web 単体 cwd でも ../../data/db に寄せる */
export function resolveDatabaseFile(cwd = process.cwd()): string {
  const fromEnv = process.env.DATABASE_PATH?.trim();
  if (fromEnv) return fromEnv;
  if (path.basename(cwd) === 'web' && path.basename(path.dirname(cwd)) === 'apps') {
    return path.resolve(cwd, '../../data/db/command-room.sqlite');
  }
  return path.join(cwd, 'data/db/command-room.sqlite');
}
