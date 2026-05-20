/** tel: リンクと平文番号 → background originate（T-CHX-004/005） */
(() => {
  document.addEventListener('click', (ev) => {
    const a = ev.target instanceof Element ? ev.target.closest('a[href^="tel:"]') : null;
    if (!a) return;
    ev.preventDefault();
    const tel = decodeURIComponent(a.getAttribute('href').slice(4));
    const num = tel.replace(/[^0-9*#+-]/g, '');
    if (!num) return;
    chrome.runtime.sendMessage({ type: 'originate', to: num });
  });

  const RE = /(\b0\d[\d-]{7,}|\b\+\d{8,})/g;
  function decorate(node) {
    if (!(node instanceof Text)) return;
    if (!node.nodeValue || !RE.test(node.nodeValue)) return;
    const span = document.createElement('span');
    span.innerHTML = node.nodeValue.replace(RE, (m) => {
      const num = m.replace(/[^0-9+]/g, '');
      return `<a href="tel:${num}" data-denwa-click="1" style="text-decoration:underline dotted">${m}</a>`;
    });
    node.parentNode?.replaceChild(span, node);
  }
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  let i = 0;
  while ((n = tw.nextNode())) {
    if (++i > 500) break;
    decorate(n);
  }
})();
