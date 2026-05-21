/**
 * Bundled to background.js — logic lives in @openpbx/core (T-CHX-008).
 */
import { originateViaBearer } from '../../packages/pbx-core/src/click2call/originate-client.ts';
import { parseOriginateContentMessage } from '../../packages/pbx-core/src/click2call/extension-message.ts';
import { normalizeContextMenuSelection } from '../../packages/pbx-core/src/click2call/content-scan.ts';

async function originateCall(toNumber: string) {
  const cfg = await chrome.storage.local.get({
    baseUrl: 'http://localhost:3000',
    from: '1001',
    token: '',
  });
  return originateViaBearer(cfg, toNumber, (url, init) =>
    fetch(url, init).then((res) => ({
      ok: res.ok,
      status: res.status,
      json: () => res.json(),
    })),
  );
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const parsed = parseOriginateContentMessage(msg);
  if (parsed) {
    originateCall(parsed.to)
      .then((r) => sendResponse({ ok: true, result: r }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'denwa-call-selection',
    title: 'denwa で発信: %s',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'denwa-call-selection' && info.selectionText) {
    const num = normalizeContextMenuSelection(info.selectionText);
    if (num) {
      try {
        await originateCall(num);
      } catch (e) {
        console.warn('[denwa-ext]', e);
      }
    }
  }
});
