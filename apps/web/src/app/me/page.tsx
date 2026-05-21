import { requireAccount, getRequestContext } from '@/lib/auth';
import { buildOtpauthUri } from '@openpbx/core';
import {
  updateMyDisplayNameAction,
  updateMyPasswordAction,
  setupTotpAction,
  disableTotpAction,
  logoutAction,
} from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
import { ClickToCallSection } from './click-to-call-section';
import { listClickToCallTokensForAccount, getExtensions } from '@/server/page-data';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const me = await requireAccount();
  const ctx = await getRequestContext();
  const secret = me.totpEnabled ? ctx.auth.getTotpSecret(me.id) : null;
  const tokens = listClickToCallTokensForAccount(me.id);
  const extensionNumbers = getExtensions().map((e) => e.number);
  return (
    <div className="mx-auto max-w-md space-y-4">
      <header>
        <h2 className="text-lg font-semibold">マイアカウント</h2>
        <p className="text-xs text-slate-500">ログイン中のアカウント情報。</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-slate-500">username</dt>
          <dd className="font-mono">{me.username}</dd>
          <dt className="text-slate-500">表示名</dt>
          <dd>{me.displayName ?? '—'}</dd>
          <dt className="text-slate-500">role</dt>
          <dd>{me.role}</dd>
          <dt className="text-slate-500">2FA</dt>
          <dd>{me.totpEnabled ? '有効' : '未設定'}</dd>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">表示名を変更</h3>
        <form action={updateMyDisplayNameAction} className="space-y-2">
          <input
            name="displayName"
            defaultValue={me.displayName ?? ''}
            placeholder="表示名"
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
            変更
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">パスワード変更</h3>
        <form action={updateMyPasswordAction} className="space-y-2">
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="新しいパスワード"
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
            変更
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">2 段階認証 (TOTP)</h3>
        {!me.totpEnabled ? (
          <form action={setupTotpAction}>
            <p className="mb-2 text-xs text-slate-500">
              有効化すると、ログイン時に Authenticator アプリの 6 桁コードが必要になります。
            </p>
            <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
              2FA を有効化
            </button>
          </form>
        ) : (
          <div className="space-y-2 text-xs">
            <p>
              シークレット:{' '}
              <code className="break-all rounded bg-slate-100 px-1 font-mono">{secret}</code>
            </p>
            <p>
              otpauth URI (QR コードに変換して Authenticator に登録):
              <br />
              <code className="break-all rounded bg-slate-100 px-1 font-mono">
                {secret ? buildOtpauthUri(me.username, secret, 'denwa') : ''}
              </code>
            </p>
            <form action={disableTotpAction}>
              <ConfirmButton
                confirmText="2FA を無効にしますか？"
                className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                2FA を無効化
              </ConfirmButton>
            </form>
          </div>
        )}
      </section>

      <ClickToCallSection tokens={tokens} extensionNumbers={extensionNumbers} />

      <section>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            ログアウト
          </button>
        </form>
      </section>
    </div>
  );
}
