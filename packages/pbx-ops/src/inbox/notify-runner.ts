import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { validateInboxMetaForIngest, type InboxKind } from '@openpbx/core';

export type RunNotifyEventInput = Readonly<{
  scriptPath: string;
  inboxDir: string;
  kind: InboxKind;
  extension: string;
  callerId: string;
  callerName: string;
  uniqueId: string;
  recordingPath?: string;
}>;

export function runNotifyEventScript(input: RunNotifyEventInput): void {
  const args = [
    input.kind,
    input.extension,
    input.callerId,
    input.callerName,
    input.uniqueId,
    input.recordingPath ?? '',
  ];
  const env: NodeJS.ProcessEnv = { ...process.env, INBOX_DIR: input.inboxDir };
  delete env.INBOX_HMAC_SECRET;
  execFileSync('bash', [input.scriptPath, ...args], {
    env,
    stdio: 'pipe',
  });
}

export function listInboxMetaFiles(inboxDir: string): string[] {
  if (!fs.existsSync(inboxDir)) return [];
  return fs.readdirSync(inboxDir).filter((f) => f.endsWith('.meta.json'));
}

export function readInboxMeta(
  inboxDir: string,
  metaName: string,
  opts?: Readonly<{ hmacSecret?: string }>,
): unknown {
  const raw = fs.readFileSync(path.join(inboxDir, metaName), 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  const secret = opts?.hmacSecret ?? '';
  if (!validateInboxMetaForIngest(parsed, secret)) {
    throw new Error(`invalid or unsigned inbox meta: ${metaName}`);
  }
  return parsed;
}
