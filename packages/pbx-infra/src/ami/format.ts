/** AMI Action メッセージ（改行区切り key: value） */

export function formatAmiAction(fields: Readonly<Record<string, string>>): string {
  const lines = Object.entries(fields).map(([k, v]) => `${k}: ${v}`);
  return `${lines.join('\r\n')}\r\n\r\n`;
}

export function isAmiLoginAccepted(fields: Readonly<Record<string, string>>): boolean {
  return (
    fields.Response === 'Success' &&
    (fields.Message?.includes('Authentication accepted') ?? false)
  );
}
