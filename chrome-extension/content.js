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
  function shouldDecoratePhoneText(hasTelLinkAncestor, parentTagName) {
    if (hasTelLinkAncestor) return false;
    return !/^(SCRIPT|STYLE|TEXTAREA|INPUT|NOSCRIPT)$/i.test(parentTagName);
  }
  function splitTextIntoPhoneSegments(text) {
    const segments = [];
    let lastIndex = 0;
    const re = new RegExp(PHONE_IN_TEXT_PATTERN.source, "g");
    let match;
    while (match = re.exec(text)) {
      const display = match[1];
      if (match.index > lastIndex) {
        segments.push({ kind: "text", value: text.slice(lastIndex, match.index) });
      }
      segments.push({
        kind: "phone",
        display,
        tel: display.replace(/[^0-9+]/g, "")
      });
      lastIndex = match.index + display.length;
    }
    if (lastIndex < text.length) {
      segments.push({ kind: "text", value: text.slice(lastIndex) });
    }
    if (segments.length === 0) {
      segments.push({ kind: "text", value: text });
    }
    return segments;
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
  function appendPhoneSegments(parent, segments) {
    for (const seg of segments) {
      if (seg.kind === "text") {
        parent.appendChild(document.createTextNode(seg.value));
        continue;
      }
      const a = document.createElement("a");
      a.href = `tel:${seg.tel}`;
      a.dataset.denwaClick = "1";
      a.style.textDecoration = "underline dotted";
      a.textContent = seg.display;
      parent.appendChild(a);
    }
  }
  function replaceTextNodeWithPhoneLinks(textNode) {
    const raw = textNode.nodeValue ?? "";
    const segments = splitTextIntoPhoneSegments(raw);
    if (segments.length === 1 && segments[0].kind === "text") return;
    const span = document.createElement("span");
    appendPhoneSegments(span, segments);
    textNode.parentNode?.replaceChild(span, textNode);
  }
  var tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var n;
  var i = 0;
  while (n = tw.nextNode()) {
    if (shouldStopContentScan(++i)) break;
    if (!(n instanceof Text)) continue;
    const parent = n.parentElement;
    if (!parent) continue;
    const insideTel = !!parent.closest('a[href^="tel:"]');
    if (!shouldDecoratePhoneText(insideTel, parent.tagName)) continue;
    replaceTextNodeWithPhoneLinks(n);
  }
})();
