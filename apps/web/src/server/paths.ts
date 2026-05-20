import path from 'node:path';

/** Server-only path resolution (pages must not import this). */
export function inboxDirectory(): string {
  return process.env.INBOX_DIR ?? path.join(process.cwd(), 'data/inbox');
}

export function recordingsDirectory(): string {
  return process.env.RECORDINGS_DIR ?? path.join(process.cwd(), 'data/recordings');
}
