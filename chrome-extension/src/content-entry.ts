/**
 * Bundled to content.js — scan logic in @openpbx/core (T-CHX-004/005).
 */
import {
  extractTelDigitsFromHref,
  shouldDecoratePhoneText,
  shouldStopContentScan,
  splitTextIntoPhoneSegments,
  type PhoneTextSegment,
} from '../../packages/pbx-core/src/click2call/content-scan.ts';

document.addEventListener('click', (ev) => {
  const a = ev.target instanceof Element ? ev.target.closest('a[href^="tel:"]') : null;
  if (!a) return;
  ev.preventDefault();
  const num = extractTelDigitsFromHref(a.getAttribute('href') ?? '');
  if (!num) return;
  chrome.runtime.sendMessage({ type: 'originate', to: num });
});

function appendPhoneSegments(parent: Element, segments: readonly PhoneTextSegment[]): void {
  for (const seg of segments) {
    if (seg.kind === 'text') {
      parent.appendChild(document.createTextNode(seg.value));
      continue;
    }
    const a = document.createElement('a');
    a.href = `tel:${seg.tel}`;
    a.dataset.denwaClick = '1';
    a.style.textDecoration = 'underline dotted';
    a.textContent = seg.display;
    parent.appendChild(a);
  }
}

function replaceTextNodeWithPhoneLinks(textNode: Text): void {
  const raw = textNode.nodeValue ?? '';
  const segments = splitTextIntoPhoneSegments(raw);
  if (segments.length === 1 && segments[0]!.kind === 'text') return;
  const span = document.createElement('span');
  appendPhoneSegments(span, segments);
  textNode.parentNode?.replaceChild(span, textNode);
}

const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let n: Node | null;
let i = 0;
while ((n = tw.nextNode())) {
  if (shouldStopContentScan(++i)) break;
  if (!(n instanceof Text)) continue;
  const parent = n.parentElement;
  if (!parent) continue;
  const insideTel = !!parent.closest('a[href^="tel:"]');
  if (!shouldDecoratePhoneText(insideTel, parent.tagName)) continue;
  replaceTextNodeWithPhoneLinks(n);
}
