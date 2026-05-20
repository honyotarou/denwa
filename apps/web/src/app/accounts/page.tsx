import { requireRole } from '@/lib/auth';
import { listAccounts, getExtensions, listExtensionGrantsForAccount } from '@/server/page-data';
import {
  createAccountAction,
  updateAccountRoleAction,
  deleteAccountAction,
  grantExtensionAction,
  revokeExtensionGrantAction,
} from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  await requireRole('admin');
  const accounts = listAccounts();
  const webrtcExts = getExtensions().filter((e) => e.webrtc).map((e) => e.number);
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">アカウント管理</h2>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <form action={createAccountAction} className="grid gap-2 sm:grid-cols-2">
          <input name="username" placeholder="ユーザー名" required className="rounded border px-2 py-1 text-sm" />
          <input name="displayName" placeholder="表示名" className="rounded border px-2 py-1 text-sm" />
          <select name="role" className="rounded border px-2 py-1 text-sm">
            <option value="user">user</option>
            <option value="supervisor">supervisor</option>
            <option value="admin">admin</option>
          </select>
          <input name="password" type="password" placeholder="初期パスワード" required className="rounded border px-2 py-1 text-sm" />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white sm:col-span-2">
            追加
          </button>
        </form>
      </section>
      <table className="w-full rounded border bg-white text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th>ユーザー</th>
            <th>表示名</th>
            <th>ロール</th>
            <th>WebRTC 割当</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => {
            const grants = listExtensionGrantsForAccount(a.id);
            return (
            <tr key={a.id} className="border-t">
              <td className="font-mono">{a.username}</td>
              <td>{a.displayName ?? '—'}</td>
              <td>
                <form action={updateAccountRoleAction} className="flex gap-1">
                  <input type="hidden" name="id" value={a.id} />
                  <select name="role" defaultValue={a.role} className="rounded border px-1 py-0.5 text-xs">
                    <option value="user">user</option>
                    <option value="supervisor">supervisor</option>
                    <option value="admin">admin</option>
                  </select>
                  <button type="submit" className="text-xs text-blue-600">
                    保存
                  </button>
                </form>
              </td>
              <td className="text-xs align-top">
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
                {a.role !== 'admin' && webrtcExts.length > 0 && (
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
                )}
              </td>
              <td>
                <form action={deleteAccountAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <ConfirmButton confirmText={`${a.username} を削除しますか？`} className="text-xs text-red-600">
                    削除
                  </ConfirmButton>
                </form>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}
