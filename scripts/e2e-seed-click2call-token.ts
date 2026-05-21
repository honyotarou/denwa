#!/usr/bin/env npx tsx
/** E2E 用 click2call Bearer token を DB に seed し JSON で出力 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { generateClickToCallTokenPlain, hashClickToCallToken } from '@openpbx/core';
import { applySchema } from '@openpbx/db';
import { createClickToCallToken } from '@openpbx/db/repos/click-to-call-tokens';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = process.env.DATABASE_PATH
  ? path.isAbsolute(process.env.DATABASE_PATH)
    ? process.env.DATABASE_PATH
    : path.join(ROOT, process.env.DATABASE_PATH)
  : path.join(ROOT, 'data/e2e-run/db/command-room.sqlite');

const e2ePort = process.env.E2E_PORT ?? '3010';
const baseUrl = `http://127.0.0.1:${e2ePort}`;

const db = new Database(dbPath);
applySchema(db);
const admin = db.prepare('SELECT id FROM accounts WHERE username = ?').get('admin') as
  | { id: number }
  | undefined;
if (!admin) {
  console.error('[e2e-click2call] admin account missing — run bootstrap first');
  process.exit(1);
}

const plain = generateClickToCallTokenPlain();
createClickToCallToken(db, {
  accountId: admin.id,
  name: 'e2e-ext',
  tokenHash: hashClickToCallToken(plain),
  fromExtension: '1001',
});

const out = {
  plain,
  from: '1001',
  baseUrl,
};
const outPath = path.join(ROOT, 'e2e/.auth/click2call.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('[e2e-click2call] OK', outPath);
