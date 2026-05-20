import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { InboxKind } from '@openpbx/core';

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
  execFileSync('bash', [input.scriptPath, ...args], {
    env: { ...process.env, INBOX_DIR: input.inboxDir },
    stdio: 'pipe',
  });
}

export function listInboxMetaFiles(inboxDir: string): string[] {
  if (!fs.existsSync(inboxDir)) return [];
  return fs.readdirSync(inboxDir).filter((f) => f.endsWith('.meta.json'));
}

export function readInboxMeta(inboxDir: string, metaName: string): unknown {
  const raw = fs.readFileSync(path.join(inboxDir, metaName), 'utf8');
  return JSON.parse(raw) as unknown;
}
