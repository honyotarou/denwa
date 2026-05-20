/** MV3 click-to-call stub — token は options の chrome.storage のみ */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'originate') {
    chrome.storage.sync.get(['baseUrl', 'from', 'token'], (cfg) => {
      const baseUrl = (cfg.baseUrl || 'http://localhost:3000').replace(/\/$/, '');
      fetch(`${baseUrl}/api/originate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: cfg.token ? `Bearer ${cfg.token}` : '',
        },
        body: JSON.stringify({ from: cfg.from || '1001', to: msg.to }),
      })
        .then((r) => sendResponse({ ok: r.ok, status: r.status }))
        .catch((e) => sendResponse({ ok: false, error: String(e) }));
    });
    return true;
  }
});
