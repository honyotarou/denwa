/** MV3 click-to-call — Bearer で /api/originate（T-CHX-008） */

async function originateCall(toNumber) {
  const cfg = await chrome.storage.sync.get({
    baseUrl: 'http://localhost:3000',
    from: '1001',
    token: '',
  });
  const baseUrl = String(cfg.baseUrl || 'http://localhost:3000').replace(/\/$/, '');
  if (!cfg.token) throw new Error('Bearer token が未設定です（拡張 options）');
  const res = await fetch(`${baseUrl}/api/originate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.token}`,
    },
    body: JSON.stringify({ from: cfg.from || '1001', to: toNumber }),
  });
  if (!res.ok) throw new Error(`originate failed: ${res.status}`);
  return res.json();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'originate') {
    originateCall(msg.to)
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
    const num = info.selectionText.replace(/[^0-9*#+-]/g, '');
    if (num) {
      try {
        await originateCall(num);
      } catch (e) {
        console.warn('[denwa-ext]', e);
      }
    }
  }
});
