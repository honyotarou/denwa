import { requireAccount } from '@/lib/auth';
import {
  updateMyDisplayNameAction,
  updateMyPasswordAction,
  setupTotpAction,
  disableTotpAction,
} from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
import { ClickToCallSection } from './click-to-call-section';
import { listClickToCallTokensForAccount, getExtensions } from '@/server/page-data';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const me = await requireAccount();
  const tokens = listClickToCallTokensForAccount(me.id);
  const extensionNumbers = getExtensions().map((e) => e.number);
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">マイアカウント</h2>
      <p className="text-sm">
        ユーザー名: {me.username} / ロール: {me.role}
      </p>
      <section className="rounded-lg border bg-white p-4">
        <form action={updateMyDisplayNameAction} className="flex gap-2">
          <input
            name="displayName"
            defaultValue={me.displayName ?? ''}
            className="rounded border px-2 py-1"
          />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">
            表示名保存
          </button>
        </form>
      </section>
      <section className="rounded-lg border bg-white p-4">
        <form action={updateMyPasswordAction} className="space-y-2">
          <input
            name="password"
            type="password"
            placeholder="新しいパスワード"
            required
            className="w-full rounded border px-2 py-1"
          />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">
            パスワード変更
          </button>
        </form>
      </section>
      <section className="rounded-lg border bg-white p-4">
        <p className="mb-2 text-sm">2FA: {me.totpEnabled ? '有効' : '未設定'}</p>
        {!me.totpEnabled ? (
          <form action={setupTotpAction}>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">
              設定する
            </button>
          </form>
        ) : (
          <form action={disableTotpAction}>
            <ConfirmButton
              confirmText="2FA を無効にしますか？"
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white"
            >
              無効化
            </ConfirmButton>
          </form>
        )}
      </section>
      <ClickToCallSection tokens={tokens} extensionNumbers={extensionNumbers} />
    </div>
  );
}
