/** ページ内電話番号スキャン（T-CHX-004/005）— DOM 操作は拡張側、ロジックは core */

import { normalizeClickToCallNumber } from './phone.js';

export const CONTENT_SCAN_MAX_TEXT_NODES = 500;

export const PHONE_IN_TEXT_PATTERN = /(\b0\d[\d-]{7,}|\b\+\d{8,})/g;

export function shouldStopContentScan(nodeCount: number): boolean {
  return nodeCount > CONTENT_SCAN_MAX_TEXT_NODES;
}

export function replacePhoneTextWithTelLinks(text: string): string {
  return text.replace(PHONE_IN_TEXT_PATTERN, (m) => {
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
