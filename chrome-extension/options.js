document.getElementById('save').addEventListener('click', () => {
  chrome.storage.local.set({
    baseUrl: document.getElementById('baseUrl').value,
    from: document.getElementById('from').value,
    token: document.getElementById('token').value,
  });
});

chrome.storage.local.get(['baseUrl', 'from', 'token'], (cfg) => {
  document.getElementById('baseUrl').value = cfg.baseUrl || 'http://localhost:3000';
  document.getElementById('from').value = cfg.from || '1001';
  document.getElementById('token').value = cfg.token || '';
});
