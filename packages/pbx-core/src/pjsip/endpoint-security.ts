/** PJSIP endpoint テンプレのメディア暗号化契約（F-016 / T-SEC-RTP-001）— 単一正本 */

export const INTERNAL_ENDPOINT_SRTP_MARKERS = [
  'media_encryption=sdes',
  'media_encryption_optimistic=no',
] as const;

export function internalEndpointTemplateRequiresSrtp(templateBlock: string): boolean {
  return INTERNAL_ENDPOINT_SRTP_MARKERS.every((m) => templateBlock.includes(m));
}

/** transports.conf から [endpoint-internal](!) ブロックを抽出 */
export function extractInternalEndpointTemplate(confText: string): string | null {
  const m = confText.match(/\[endpoint-internal\]\(!\)[\s\S]*?(?=\n\[|$)/);
  return m ? m[0] : null;
}

export function pjsipTransportsConfRequiresInternalSrtp(confText: string): boolean {
  const block = extractInternalEndpointTemplate(confText);
  if (!block) return false;
  return internalEndpointTemplateRequiresSrtp(block);
}
