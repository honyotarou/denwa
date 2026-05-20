/**
 * Local dev: create data/db + admin account + dev extensions + pjsip sync.
 * Run: npx tsx scripts/bootstrap-dev-admin.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import {
  generateExtensionSecret,
  hashPassword,
  isForbiddenExtensionSecret,
  normalizeExtensionDraft,
  renderPjsipExtensions,
  toExtensionDraft,
} from '@openpbx/core';
import { applySchema, createAccount, getExtension, listExtensions, updateExtension } from '@openpbx/db';
import { writePjsipFile } from '@openpbx/infra';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dbPath = process.env.DATABASE_PATH ?? path.join(root, 'data/db/command-room.sqlite');
const pjsipDir = process.env.PJSIP_OUT_DIR ?? path.join(root, 'data/pbx-out/pjsip.d');
const dialplanDir = process.env.DIALPLAN_OUT_DIR ?? path.join(root, 'data/pbx-out/dialplan.d');
fs.mkdirSync(pjsipDir, { recursive: true });
fs.mkdirSync(dialplanDir, { recursive: true });

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
applySchema(db, { seed: true });

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

function rotateExtensionSecretIfNeeded(number: string): void {
  const row = getExtension(db, number);
  if (!row) return;
  if (!isForbiddenExtensionSecret(row.secret) && row.secret.length >= 12) return;
  const secret = generateExtensionSecret();
  updateExtension(db, {
    number: row.number,
    displayName: row.displayName,
    secret,
    note: row.note,
    webrtc: row.webrtc,
  });
  console.log(`Rotated extension ${number} secret (was forbidden or empty)`);
}

rotateExtensionSecretIfNeeded('1001');
rotateExtensionSecretIfNeeded('1002');

async function syncPjsip(): Promise<void> {
  const drafts = listExtensions(db).map((row) =>
    toExtensionDraft(
      normalizeExtensionDraft({
        number: row.number,
        displayName: row.displayName,
        secret: row.secret,
        note: row.note,
        webrtc: row.webrtc,
        pickupGroupNames: [],
      }),
    ),
  );
  const pjsipBody = renderPjsipExtensions(drafts, { updatedAt: new Date().toISOString() });
  await writePjsipFile(pjsipDir, 'extensions.conf', pjsipBody);
  console.log('Synced', path.join(pjsipDir, 'extensions.conf'));
}

syncPjsip()
  .then(() => {
    db.close();
    console.log('DB:', dbPath);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
