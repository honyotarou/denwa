/**
 * Bundled to content.js — scan logic in @openpbx/core (T-CHX-004/005).
 */
import {
  extractTelDigitsFromHref,
  replacePhoneTextWithTelLinks,
  shouldStopContentScan,
} from '../../packages/pbx-core/src/click2call/content-scan.ts';

document.addEventListener('click', (ev) => {
  const a = ev.target instanceof Element ? ev.target.closest('a[href^="tel:"]') : null;
  if (!a) return;
  ev.preventDefault();
  const num = extractTelDigitsFromHref(a.getAttribute('href') ?? '');
  if (!num) return;
  chrome.runtime.sendMessage({ type: 'originate', to: num });
});

const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let n: Node | null;
let i = 0;
while ((n = tw.nextNode())) {
  if (shouldStopContentScan(++i)) break;
  if (!(n instanceof Text) || !n.nodeValue) continue;
  const span = document.createElement('span');
  span.innerHTML = replacePhoneTextWithTelLinks(n.nodeValue);
  n.parentNode?.replaceChild(span, n);
}
