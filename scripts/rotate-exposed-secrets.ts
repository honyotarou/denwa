/**
 * DB 漏洩後の資格情報ローテーション（T-SEC-SESSION-002 / T-PROD-001）。
 *
 * - 全 session 無効化
 * - admin パスワード再設定（ROTATE_ADMIN_PASSWORD または自動生成）
 * - 全内線 secret 再生成 + pjsip 同期
 * - click-to-call トークン失効
 * - 全アカウント TOTP 解除
 *
 * Usage:
 *   npx tsx scripts/rotate-exposed-secrets.ts
 *   ROTATE_ADMIN_PASSWORD='your-new-password' DATABASE_PATH=... npx tsx scripts/rotate-exposed-secrets.ts
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import {
  generateExtensionSecret,
  hashPassword,
  normalizeExtensionDraft,
  normalizeNetworkSettingsDraft,
  renderEmptyTrunksPjsip,
  renderPjsipExtensions,
  renderPjsipTransportsConf,
  toExtensionDraft,
} from '@openpbx/core';
import {
  destroyAllSessions,
  getAccountByUsername,
  listExtensions,
  listPickupGroupNamesByExtension,
  revokeAllActiveClickToCallTokens,
  setPasswordHash,
  updateExtension,
} from '@openpbx/db';
import { writePjsipFile } from '@openpbx/infra';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dbPath = process.env.DATABASE_PATH ?? path.join(root, 'data/db/command-room.sqlite');
const pjsipDir = process.env.PJSIP_OUT_DIR ?? path.join(root, 'data/pbx-out/pjsip.d');

function randomAdminPassword(): string {
  return crypto.randomBytes(18).toString('base64url');
}

async function syncPjsip(db: Database.Database): Promise<void> {
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
  await writePjsipFile(pjsipDir, 'extensions.conf', renderPjsipExtensions(drafts, { updatedAt: stamp }));
  const transports = renderPjsipTransportsConf({
    settings: normalizeNetworkSettingsDraft({}),
    updatedAt: stamp,
  });
  if (!transports) throw new Error('renderPjsipTransportsConf failed');
  await writePjsipFile(pjsipDir, 'transports.conf', transports);
  const trunksPath = path.join(pjsipDir, 'trunks.conf');
  if (!fs.existsSync(trunksPath)) {
    fs.writeFileSync(trunksPath, renderEmptyTrunksPjsip(stamp));
  }
}

function clearAllTotp(db: Database.Database): number {
  return db.prepare(`UPDATE accounts SET totp_secret = NULL, totp_last_counter = NULL`).run().changes;
}

async function main(): Promise<void> {
  if (!fs.existsSync(dbPath)) {
    console.error(`database not found: ${dbPath}`);
    process.exit(1);
  }

  const db = new Database(dbPath);
  const sessionsRemoved = destroyAllSessions(db);
  const tokensRevoked = revokeAllActiveClickToCallTokens(db);
  const totpCleared = clearAllTotp(db);

  const admin = getAccountByUsername(db, 'admin');
  if (!admin) {
    console.error('admin account not found — run bootstrap-dev-admin first');
    db.close();
    process.exit(1);
  }

  const newPassword = process.env.ROTATE_ADMIN_PASSWORD?.trim() || randomAdminPassword();
  setPasswordHash(db, admin.id, hashPassword(newPassword));

  const rotated: Array<{ number: string; secret: string }> = [];
  for (const ext of listExtensions(db)) {
    const secret = generateExtensionSecret();
    updateExtension(db, {
      number: ext.number,
      displayName: ext.displayName,
      secret,
      note: ext.note,
      webrtc: ext.webrtc,
    });
    rotated.push({ number: ext.number, secret });
  }

  fs.mkdirSync(pjsipDir, { recursive: true });
  await syncPjsip(db);
  db.close();

  console.log('rotate-exposed-secrets: OK');
  console.log('DB:', dbPath);
  console.log(`sessions removed: ${sessionsRemoved}`);
  console.log(`click-to-call tokens revoked: ${tokensRevoked}`);
  console.log(`totp accounts cleared: ${totpCleared}`);
  console.log('');
  console.log('=== NEW ADMIN PASSWORD (store in password manager; not in git) ===');
  console.log(newPassword);
  console.log('');
  if (rotated.length > 0) {
    console.log('=== NEW EXTENSION SECRETS (re-register SIP clients) ===');
    for (const { number, secret } of rotated) {
      console.log(`${number}\t${secret}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
