'use client';

import { useState } from 'react';
import {
  createClickToCallTokenAction,
  revokeClickToCallTokenAction,
} from '@/app/actions/click-to-call';

export type ClickTokenListItem = Readonly<{
  id: number;
  name: string;
  fromExtension: string;
  createdAt: string;
  revokedAt: string | null;
}>;

export function ClickToCallSection({
  tokens,
  extensionNumbers,
}: {
  tokens: ClickTokenListItem[];
  extensionNumbers: string[];
}) {
  const [issuedPlain, setIssuedPlain] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function onCreate(formData: FormData) {
    setFormError(null);
    setIssuedPlain(null);
    const r = await createClickToCallTokenAction(formData);
    if (r.ok) setIssuedPlain(r.plain);
    else setFormError(r.error);
  }

  return (
    <section className="rounded-lg border bg-white p-4 space-y-3">
      <h3 className="text-sm font-semibold">Click-to-call トークン（Chrome 拡張用）</h3>
      <p className="text-xs text-slate-500">
        Bearer で <code className="font-mono">POST /api/originate</code> を呼びます。平文は発行時のみ表示します。
      </p>
      <form action={onCreate} className="flex flex-wrap gap-2 items-end">
        <label className="text-xs">
          名前
          <input name="name" required className="mt-1 block rounded border px-2 py-1 text-sm" placeholder="laptop" />
        </label>
        <label className="text-xs">
          発信元内線
          <select name="fromExtension" className="mt-1 block rounded border px-2 py-1 text-sm">
            {extensionNumbers.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">
          発行
        </button>
      </form>
      {formError && <p className="text-xs text-red-700">{formError}</p>}
      {issuedPlain && (
        <p className="text-xs font-mono break-all rounded bg-amber-50 border border-amber-200 p-2">
          トークン（コピーして拡張 options に保存）: {issuedPlain}
        </p>
      )}
      <ul className="text-xs space-y-1">
        {tokens.map((t) => (
          <li key={t.id} className="flex gap-2 items-center">
            <span className="font-mono">
              {t.name} / {t.fromExtension}
              {t.revokedAt ? ' (失効)' : ''}
            </span>
            {!t.revokedAt && (
              <form action={revokeClickToCallTokenAction}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="text-red-600">
                  失効
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
