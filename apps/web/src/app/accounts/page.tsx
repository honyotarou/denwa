import { requireRole } from '@/lib/auth';
import { listAccounts, getExtensions, listExtensionGrantsForAccount } from '@/server/page-data';
import {
  createAccountAction,
  updateAccountRoleAction,
  updateAccountDisplayNameAction,
  updateAccountPasswordAction,
  deleteAccountAction,
  grantExtensionAction,
  revokeExtensionGrantAction,
} from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';

export const dynamic = 'force-dynamic';

type AccountItem = ReturnType<typeof listAccounts>[number];

export default async function AccountsPage() {
  const me = await requireRole('admin');
  const accounts = listAccounts();
  const webrtcExts = getExtensions().filter((e) => e.webrtc).map((e) => e.number);
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">アカウント管理</h2>
        <p className="text-xs text-slate-500">
          ログインユーザーの追加・編集・削除。ロール: user / supervisor / admin。自分自身の削除・最後の admin
          降格はブロックされます。
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">新規追加</h3>
        <form action={createAccountAction} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_140px_auto]">
          <input
            name="username"
            required
            pattern="[A-Za-z0-9_-]{3,32}"
            placeholder="username (3-32文字)"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <input name="displayName" placeholder="表示名" className="rounded border border-slate-300 px-2 py-1 text-sm" />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="password"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <select name="role" defaultValue="user" className="rounded border border-slate-300 px-2 py-1 text-sm">
            <option value="user">user</option>
            <option value="supervisor">supervisor</option>
            <option value="admin">admin</option>
          </select>
          <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
            追加
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">一覧 ({accounts.length})</h3>
        <ul className="divide-y divide-slate-200">
          {accounts.map((a) => (
            <AccountRow
              key={a.id}
              account={a}
              isMe={a.id === me.id}
              webrtcExts={webrtcExts}
              grants={listExtensionGrantsForAccount(a.id)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function AccountRow({
  account: a,
  isMe,
  webrtcExts,
  grants,
}: {
  account: AccountItem;
  isMe: boolean;
  webrtcExts: readonly string[];
  grants: readonly string[];
}) {
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-baseline gap-3 text-sm">
        <span className="font-mono">{a.username}</span>
        {isMe && (
          <span className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
            あなた
          </span>
        )}
        <span className="text-slate-600">{a.displayName ?? '—'}</span>
        <span className="text-xs text-slate-500">{a.role}</span>
        {a.totpEnabled && (
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800">
            2FA
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400">{a.createdAt}</span>
      </div>

      <form action={updateAccountDisplayNameAction} className="grid grid-cols-[1fr_auto] gap-2">
        <input type="hidden" name="id" value={a.id} />
        <input
          name="displayName"
          defaultValue={a.displayName ?? ''}
          placeholder="表示名"
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        />
        <button type="submit" className="rounded border border-slate-300 bg-white px-2 py-1 text-xs">
          表示名を更新
        </button>
      </form>

      <form action={updateAccountRoleAction} className="grid grid-cols-[140px_auto] gap-2">
        <input type="hidden" name="id" value={a.id} />
        <select name="role" defaultValue={a.role} className="rounded border border-slate-300 px-2 py-1 text-xs">
          <option value="user">user</option>
          <option value="supervisor">supervisor</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit" className="rounded border border-slate-300 bg-white px-2 py-1 text-xs">
          ロールを更新
        </button>
      </form>

      <form action={updateAccountPasswordAction} className="grid grid-cols-[1fr_auto] gap-2">
        <input type="hidden" name="id" value={a.id} />
        <input
          name="password"
          type="password"
          minLength={8}
          placeholder="新しいパスワード"
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        />
        <button type="submit" className="rounded border border-slate-300 bg-white px-2 py-1 text-xs">
          パスワードを更新
        </button>
      </form>

      {a.role !== 'admin' && webrtcExts.length > 0 && (
        <div className="text-xs">
          <div className="mb-1 text-slate-500">WebRTC 割当</div>
          <ul className="mb-1 space-y-0.5">
            {grants.map((g) => (
              <li key={g} className="flex gap-1">
                <span className="font-mono">{g}</span>
                <form action={revokeExtensionGrantAction}>
                  <input type="hidden" name="accountId" value={a.id} />
                  <input type="hidden" name="extensionNumber" value={g} />
                  <button type="submit" className="text-red-600">
                    解除
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <form action={grantExtensionAction} className="flex gap-1">
            <input type="hidden" name="accountId" value={a.id} />
            <select name="extensionNumber" className="rounded border px-1 text-xs">
              {webrtcExts.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button type="submit" className="text-blue-600">
              割当
            </button>
          </form>
        </div>
      )}

      {!isMe && (
        <form action={deleteAccountAction}>
          <input type="hidden" name="id" value={a.id} />
          <ConfirmButton
            confirmText={`アカウント "${a.username}" を削除しますか？`}
            className="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50"
          >
            削除
          </ConfirmButton>
        </form>
      )}
    </li>
  );
}
