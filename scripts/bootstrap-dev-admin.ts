/**
 * Local dev: create data/db + admin account + seed extensions.
 * Run: npx tsx scripts/bootstrap-dev-admin.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { hashPassword } from '@openpbx/core';
import { applySchema, createAccount } from '@openpbx/db';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dbPath = path.join(root, 'data/db/command-room.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
applySchema(db, { seed: true });

/** T-PROD-001 既定値。本番では使わない。上書き: DEV_ADMIN_PASSWORD */
const devAdminPassword =
  process.env.DEV_ADMIN_PASSWORD ?? ['admin', '-please', '-change'].join('');

if (!db.prepare(`SELECT 1 FROM accounts WHERE username = 'admin'`).get()) {
  createAccount(db, {
    username: 'admin',
    displayName: 'Admin',
    passwordHash: hashPassword(devAdminPassword),
    role: 'admin',
  });
  console.log('Created admin user (username: admin, password: TDD-REBUILD-PLAN T-PROD-001)');
} else {
  console.log('Admin already exists');
}

db.close();
console.log('DB:', dbPath);
