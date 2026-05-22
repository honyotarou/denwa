/** ページ内電話番号スキャン（T-CHX-004/005）— DOM 操作は拡張側、ロジックは core */

import { normalizeClickToCallNumber } from './phone.js';

export const CONTENT_SCAN_MAX_TEXT_NODES = 500;

export const PHONE_IN_TEXT_PATTERN = /(\b0\d[\d-]{7,}|\b\+\d{8,})/g;

export type PhoneTextSegment =
  | Readonly<{ kind: 'text'; value: string }>
  | Readonly<{ kind: 'phone'; display: string; tel: string }>;

export function shouldStopContentScan(nodeCount: number): boolean {
  return nodeCount > CONTENT_SCAN_MAX_TEXT_NODES;
}

/** tel: リンク内・フォーム等は再装飾しない */
export function shouldDecoratePhoneText(hasTelLinkAncestor: boolean, parentTagName: string): boolean {
  if (hasTelLinkAncestor) return false;
  return !/^(SCRIPT|STYLE|TEXTAREA|INPUT|NOSCRIPT)$/i.test(parentTagName);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function splitTextIntoPhoneSegments(text: string): readonly PhoneTextSegment[] {
  const segments: PhoneTextSegment[] = [];
  let lastIndex = 0;
  const re = new RegExp(PHONE_IN_TEXT_PATTERN.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const display = match[1]!;
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({
      kind: 'phone',
      display,
      tel: display.replace(/[^0-9+]/g, ''),
    });
    lastIndex = match.index + display.length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIndex) });
  }
  if (segments.length === 0) {
    segments.push({ kind: 'text', value: text });
  }
  return segments;
}

/** @deprecated Prefer splitTextIntoPhoneSegments + DOM nodes in content script */
export function replacePhoneTextWithTelLinks(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(PHONE_IN_TEXT_PATTERN, (m) => {
    const num = m.replace(/[^0-9+]/g, '');
    return `<a href="tel:${num}" data-denwa-click="1" style="text-decoration:underline dotted">${m}</a>`;
  });
}

export function extractTelDigitsFromHref(href: string): string | null {
  if (!href?.startsWith('tel:')) return null;
  const tel = decodeURIComponent(href.slice(4));
  const normalized = normalizeClickToCallNumber(tel);
  if (normalized) return normalized;
  const raw = tel.replace(/[^0-9*#+-]/g, '');
  return raw || null;
}

export function normalizeContextMenuSelection(text: string): string | null {
  const num = (text ?? '').replace(/[^0-9*#+-]/g, '');
  return num || null;
}
