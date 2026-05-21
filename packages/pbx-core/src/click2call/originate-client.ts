/** Chrome / 拡張向け originate HTTP 契約（T-CHX-007〜009） */

import { normalizeClickToCallNumber } from './phone.js';

export type Click2CallStorageConfig = Readonly<{
  baseUrl: string;
  from: string;
  token: string;
}>;

export function normalizeClick2CallStorage(
  raw: Partial<Click2CallStorageConfig>,
): Readonly<{ ok: true; config: Click2CallStorageConfig } | { ok: false; error: string }> {
  const baseUrl = String(raw.baseUrl ?? 'http://localhost:3000')
    .trim()
    .replace(/\/$/, '');
  const from = String(raw.from ?? '1001').trim() || '1001';
  const token = String(raw.token ?? '').trim();
  if (!token) {
    return { ok: false, error: 'Bearer token が未設定です（拡張 options）' };
  }
  return { ok: true, config: { baseUrl, from, token } };
}

export function buildOriginateHttpRequest(
  config: Click2CallStorageConfig,
  toRaw: string,
): Readonly<{ url: string; init: RequestInit }> {
  const normalized = normalizeClickToCallNumber(toRaw) ?? toRaw.replace(/[^0-9*#+-]/g, '');
  return {
    url: `${config.baseUrl}/api/originate`,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({ from: config.from, to: normalized }),
    },
  };
}

export type OriginateFetch = (
  input: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

/** background.js の originate 本体（fetch 注入でテスト） */
export async function originateViaBearer(
  rawConfig: Partial<Click2CallStorageConfig>,
  toRaw: string,
  fetchFn: OriginateFetch,
): Promise<unknown> {
  const norm = normalizeClick2CallStorage(rawConfig);
  if (!norm.ok) throw new Error(norm.error);
  const { url, init } = buildOriginateHttpRequest(norm.config, toRaw);
  const res = await fetchFn(url, init);
  if (res.status === 401) {
    throw new Error('originate unauthorized: token を確認してください');
  }
  if (!res.ok) {
    throw new Error(`originate failed: ${res.status}`);
  }
  return res.json();
}
