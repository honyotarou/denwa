/**
 * dev: 1001/1002 を WebRTC 内線にして pjsip.d を同期
 * Run: npx tsx scripts/enable-webrtc-extensions.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import {
  normalizeExtensionDraft,
  renderPjsipExtensions,
  toExtensionDraft,
} from '@openpbx/core';
import {
  getExtension,
  listExtensions,
  listPickupGroupNamesByExtension,
  updateExtension,
} from '@openpbx/db';
import { writePjsipFile } from '@openpbx/infra';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dbPath = process.env.DATABASE_PATH ?? path.join(root, 'data/db/command-room.sqlite');
const pjsipDir = process.env.PJSIP_OUT_DIR ?? path.join(root, 'data/pbx-out/pjsip.d');

const db = new Database(dbPath);

for (const n of ['1001', '1002']) {
  const row = getExtension(db, n);
  if (!row) {
    console.error(`extension ${n} not found`);
    process.exit(1);
  }
  updateExtension(db, {
    number: n,
    displayName: row.displayName,
    secret: row.secret,
    note: row.note,
    webrtc: true,
  });
  console.log(`WebRTC ON: ${n}`);
}

const pickupByExt = listPickupGroupNamesByExtension(db);
const drafts = listExtensions(db).map((row) =>
  toExtensionDraft(
    normalizeExtensionDraft({
      number: row.number,
      displayName: row.displayName,
      secret: row.secret,
      note: row.note,
      webrtc: row.webrtc,
      pickupGroupNames: pickupByExt.get(row.number) ?? [],
    }),
  ),
);
const stamp = new Date().toISOString();
const body = renderPjsipExtensions(drafts, { updatedAt: stamp });

async function main(): Promise<void> {
  await writePjsipFile(pjsipDir, 'extensions.conf', body);
  const text = fs.readFileSync(path.join(pjsipDir, 'extensions.conf'), 'utf8');
  if (!text.includes('endpoint-webrtc')) {
    console.error('extensions.conf missing endpoint-webrtc');
    process.exit(1);
  }
  console.log('Synced', path.join(pjsipDir, 'extensions.conf'));
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
