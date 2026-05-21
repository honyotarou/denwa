/** Generated — edit chrome-extension/src/content-entry.ts */

(() => {
  // packages/pbx-core/src/click2call/phone.ts
  function normalizeClickToCallNumber(raw) {
    const t = (raw ?? "").trim();
    if (!t) return null;
    if (t.startsWith("tel:")) return normalizeClickToCallNumber(t.slice(4));
    const digits = t.replace(/[^\d+]/g, "");
    if (!digits) return null;
    if (digits.startsWith("+81")) {
      let rest = digits.slice(3).replace(/^0/, "");
      if (/^\d{9,10}$/.test(rest) && !rest.startsWith("0")) rest = `0${rest}`;
      if (/^\d{9,11}$/.test(rest)) return rest;
      return null;
    }
    if (digits.startsWith("0") && /^\d{9,11}$/.test(digits)) return digits;
    if (/^\d{9,11}$/.test(digits)) return digits;
    return null;
  }

  // packages/pbx-core/src/click2call/content-scan.ts
  var CONTENT_SCAN_MAX_TEXT_NODES = 500;
  var PHONE_IN_TEXT_PATTERN = /(\b0\d[\d-]{7,}|\b\+\d{8,})/g;
  function shouldStopContentScan(nodeCount) {
    return nodeCount > CONTENT_SCAN_MAX_TEXT_NODES;
  }
  function replacePhoneTextWithTelLinks(text) {
    return text.replace(PHONE_IN_TEXT_PATTERN, (m) => {
      const num = m.replace(/[^0-9+]/g, "");
      return `<a href="tel:${num}" data-denwa-click="1" style="text-decoration:underline dotted">${m}</a>`;
    });
  }
  function extractTelDigitsFromHref(href) {
    if (!href?.startsWith("tel:")) return null;
    const tel = decodeURIComponent(href.slice(4));
    const normalized = normalizeClickToCallNumber(tel);
    if (normalized) return normalized;
    const raw = tel.replace(/[^0-9*#+-]/g, "");
    return raw || null;
  }

  // chrome-extension/src/content-entry.ts
  document.addEventListener("click", (ev) => {
    const a = ev.target instanceof Element ? ev.target.closest('a[href^="tel:"]') : null;
    if (!a) return;
    ev.preventDefault();
    const num = extractTelDigitsFromHref(a.getAttribute("href") ?? "");
    if (!num) return;
    chrome.runtime.sendMessage({ type: "originate", to: num });
  });
  var tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var n;
  var i = 0;
  while (n = tw.nextNode()) {
    if (shouldStopContentScan(++i)) break;
    if (!(n instanceof Text) || !n.nodeValue) continue;
    const span = document.createElement("span");
    span.innerHTML = replacePhoneTextWithTelLinks(n.nodeValue);
    n.parentNode?.replaceChild(span, n);
  }
})();
