/** Asterisk HTTP/ARI バインド契約（T-SEC-A05-001 / F-003）— 単一正本 */

const LOOPBACK = '127.0.0.1' as const;

function readIniValue(text: string, key: string): string | null {
  const m = text.match(new RegExp(`^\\s*${key}\\s*=\\s*(\\S+)`, 'm'));
  return m ? m[1]! : null;
}

/** http.conf がコンテナ内 loopback のみにバインドしているか */
export function asteriskHttpConfIsLoopbackOnly(confText: string): boolean {
  const bindaddr = readIniValue(confText, 'bindaddr');
  const tlsbindaddr = readIniValue(confText, 'tlsbindaddr');
  if (bindaddr !== LOOPBACK) return false;
  if (!tlsbindaddr) return true;
  return tlsbindaddr === `${LOOPBACK}:8089` || tlsbindaddr.startsWith(`${LOOPBACK}:`);
}
