import fs from 'node:fs/promises';
import path from 'node:path';
import { validateExtensionDraft, normalizeExtensionDraft, validateOriginateRequest, buildInboxMeta } from '@openpbx/core';
import {
  DuplicateError,
  getCdrRecord,
  listExtensions,
  searchPhonebook,
  upsertGuidance,
  deleteGuidance,
} from '@openpbx/db';
import { ingestCdrFile } from '@openpbx/infra';
import { DeviceMap } from '@openpbx/infra';
import { openRecordingReadStream, resolveRecordingPath, saveGuidanceWav } from '@openpbx/infra';
import { validateInboxMeta } from '@openpbx/infra';
import type { AppContext } from './context';
import { AuthError } from './auth';

function maskSecret(role: string, secret: string): string {
  return role === 'admin' ? secret : '***';
}

export async function handleHealthGet(): Promise<{ status: number; body: unknown }> {
  return { status: 200, body: { ok: true } };
}

export async function handleCdrIngestPost(ctx: AppContext): Promise<{ status: number; body: unknown }> {
  try {
    ctx.auth.requireMinRole(ctx.sessionToken, ctx.meta, 'supervisor');
  } catch (e) {
    const err = e as AuthError;
    return { status: err.status, body: { error: err.message } };
  }
  const csvPath = process.env.CDR_CSV_PATH ?? path.join(ctx.infraDirs.recordingsDir, '../asterisk-cdr/Master.csv');
  const r = await ingestCdrFile(ctx.db, csvPath);
  return { status: 200, body: r };
}

export async function handleDevicesStreamGet(
  ctx: AppContext,
): Promise<{ status: number; headers: Record<string, string>; stream: ReadableStream }> {
  try {
    ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  } catch (e) {
    const err = e as AuthError;
    return {
      status: err.status,
      headers: { 'Content-Type': 'application/json' },
      stream: new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(JSON.stringify({ error: err.message })));
          c.close();
        },
      }),
    };
  }
  const map = new DeviceMap();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const payload = { devices: map.getDevices(), connected: false };
      controller.enqueue(
        encoder.encode(`event: snapshot\ndata: ${JSON.stringify(payload)}\n\n`),
      );
    },
  });
  return {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    stream,
  };
}

export async function handleExtensionsGet(ctx: AppContext): Promise<{ status: number; body: unknown }> {
  let me;
  try {
    me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  } catch (e) {
    const err = e as AuthError;
    return { status: err.status, body: { error: err.message } };
  }
  const extensions = listExtensions(ctx.db).map((e) => ({
    ...e,
    secret: maskSecret(me.role, e.secret),
  }));
  return { status: 200, body: { extensions } };
}

export async function handleExtensionsPost(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<{ status: number; body: unknown }> {
  try {
    ctx.auth.requireMinRole(ctx.sessionToken, ctx.meta, 'user');
  } catch (e) {
    const err = e as AuthError;
    return { status: err.status, body: { error: err.message } };
  }
  const draft = normalizeExtensionDraft({
    number: String(body.number ?? ''),
    secret: String(body.secret ?? ''),
    displayName: typeof body.displayName === 'string' ? body.displayName : null,
    webrtc: body.webrtc === true,
  });
  const errs = validateExtensionDraft(draft);
  if (errs.length) return { status: 400, body: { error: errs.join('; ') } };
  try {
    ctx.infra.extensions.create(draft);
    await ctx.infra.syncPjsipExtensions();
    return { status: 201, body: { ok: true } };
  } catch (e) {
    if (e instanceof DuplicateError) return { status: 400, body: { error: e.message } };
    throw e;
  }
}

export async function handleOriginatePost(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<{ status: number; body: unknown }> {
  let me;
  try {
    me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  } catch (e) {
    const err = e as AuthError;
    return { status: err.status, body: { error: err.message } };
  }
  const req = { from: String(body.from ?? ''), to: String(body.to ?? '') };
  const errs = validateOriginateRequest(req);
  if (errs.length) return { status: 400, body: { error: errs.join('; ') } };
  ctx.auth.recordAudit({
    actor: me.username,
    action: 'click2call',
    target: `${req.from}->${req.to}`,
    ip: ctx.meta.ip,
    userAgent: ctx.meta.userAgent,
  });
  return { status: 200, body: { ok: true, mocked: true } };
}

export async function handlePhonebookLookupGet(
  ctx: AppContext,
  q: string,
): Promise<{ status: number; body: unknown }> {
  try {
    ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  } catch (e) {
    const err = e as AuthError;
    return { status: err.status, body: { error: err.message } };
  }
  return { status: 200, body: { entries: searchPhonebook(ctx.db, q) } };
}

export async function handleGuidancesPost(
  ctx: AppContext,
  name: string,
  wav: Uint8Array,
): Promise<{ status: number; body: unknown }> {
  try {
    ctx.auth.requireMinRole(ctx.sessionToken, ctx.meta, 'user');
  } catch (e) {
    const err = e as AuthError;
    return { status: err.status, body: { error: err.message } };
  }
  try {
    await saveGuidanceWav(ctx.infraDirs.soundsDir, name, wav);
    upsertGuidance(ctx.db, { name });
    return { status: 201, body: { ok: true } };
  } catch (e) {
    return { status: 400, body: { error: (e as Error).message } };
  }
}

export async function handleRecordingGet(
  ctx: AppContext,
  file: string,
): Promise<{ status: number; body?: unknown; stream?: NodeJS.ReadableStream }> {
  try {
    ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  } catch (e) {
    const err = e as AuthError;
    return { status: err.status, body: { error: err.message } };
  }
  try {
    resolveRecordingPath(ctx.infraDirs.recordingsDir, file);
    const stream = openRecordingReadStream(ctx.infraDirs.recordingsDir, file);
    return { status: 200, stream };
  } catch {
    return { status: 400, body: { error: 'invalid filename' } };
  }
}

export async function ensureRecordingFixture(ctx: AppContext, name: string): Promise<void> {
  const p = path.join(ctx.infraDirs.recordingsDir, name);
  await fs.mkdir(ctx.infraDirs.recordingsDir, { recursive: true });
  await fs.writeFile(p, Buffer.from('RIFFxxxxWAVE'));
}

export function getCdr(ctx: AppContext, uniqueid: string) {
  return getCdrRecord(ctx.db, uniqueid);
}
