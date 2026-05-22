import { requireRole } from '@/lib/auth';
import { listSipTrunks } from '@/server/page-data';
import { upsertTrunkAction, deleteTrunkAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
import { PageHeader } from '@/components/PageHeader';
import { PageSection } from '@/components/PageSection';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type TrunkListItem = ReturnType<typeof listSipTrunks>[number];

export default async function TrunksPage() {
  await requireRole('admin');
  const trunks = listSipTrunks();
  return (
    <div className="space-y-6">
      <PageHeader
        title="外線 (SIP trunk)"
        description="外線プロバイダ（050 / 0ABJ、各種 SIP プロバイダ等）との接続を管理します。 outbound_prefix を設定すると、その prefix で始まる発信を trunk へ。 did_inbound を設定すると、その番号宛の着信を internal context の同番号にルーティングします。保存すると PJSIP / dialplan を同期します。"
      />

      <PageSection title="新規追加">
        <TrunkForm action={upsertTrunkAction} submitLabel="追加" />
      </PageSection>

      <PageSection title={`登録済み (${trunks.length})`}>
        {trunks.length === 0 ? (
          <p className="text-sm text-slate-500">まだ trunk がありません。</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {trunks.map((t) => (
              <li key={t.id} className="py-4">
                <div className="mb-3 font-mono text-sm text-slate-700">
                  {t.name}{' '}
                  <span className="text-slate-500">
                    — {t.host}:{t.port}
                    {t.registration ? ' (register)' : ''}
                  </span>
                </div>
                <TrunkForm
                  action={upsertTrunkAction}
                  initial={t}
                  submitLabel="保存"
                  deleteAction={deleteTrunkAction}
                />
              </li>
            ))}
          </ul>
        )}
      </PageSection>
    </div>
  );
}

interface TrunkFormProps {
  action: (formData: FormData) => Promise<void>;
  initial?: TrunkListItem;
  submitLabel: string;
  deleteAction?: (formData: FormData) => Promise<void>;
}

function TrunkForm({ action, initial, submitLabel, deleteAction }: TrunkFormProps) {
  const isEdit = !!initial;
  return (
    <form action={action} className="space-y-4">
      <div>
        <h4 className="mb-2 text-xs font-semibold text-slate-600">基本</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs text-slate-600">
          名前 (英数字)
          <input
            name="name"
            required
            pattern="[A-Za-z0-9_-]{1,32}"
            defaultValue={initial?.name ?? ''}
            readOnly={isEdit}
            placeholder="例: provider-main"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm read-only:bg-slate-100"
          />
        </label>
        <label className="text-xs text-slate-600">
          ホスト
          <input
            name="host"
            required
            defaultValue={initial?.host ?? ''}
            placeholder="sip.example.com"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
        </label>
        <label className="text-xs text-slate-600">
          ポート
          <input
            name="port"
            type="number"
            min={1}
            max={65535}
            defaultValue={initial?.port ?? 5060}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
        </label>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold text-slate-600">認証</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-600">
          username
          <input
            name="username"
            defaultValue={initial?.username ?? ''}
            placeholder="SIP ユーザー名"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
        </label>
        <label className="text-xs text-slate-600">
          secret
          <input
            name="secret"
            type="password"
            autoComplete="new-password"
            placeholder={isEdit ? '変更時のみ入力' : 'SIP パスワード'}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
        </label>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold text-slate-600">ルーティング</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-600">
          from_user
          <input
            name="fromUser"
            defaultValue={initial?.fromUser ?? ''}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
        </label>
        <label className="text-xs text-slate-600">
          from_domain
          <input
            name="fromDomain"
            defaultValue={initial?.fromDomain ?? ''}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
        </label>
        <label className="text-xs text-slate-600">
          did_inbound
          <input
            name="didInbound"
            defaultValue={initial?.didInbound ?? ''}
            placeholder="0312345678"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
        </label>
        <label className="text-xs text-slate-600">
          outbound_prefix
          <input
            name="outboundPrefix"
            defaultValue={initial?.outboundPrefix ?? ''}
            placeholder="0"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
        </label>
        </div>
      </div>

      <label className="block text-xs text-slate-600">
        メモ
        <input
          name="note"
          defaultValue={initial?.note ?? ''}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          name="registration"
          defaultChecked={initial?.registration ?? true}
          className="h-4 w-4"
        />
        register する（プロバイダへ SIP REGISTER）
      </label>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          {submitLabel}
        </button>
        {isEdit && deleteAction && (
          <ConfirmButton
            confirmText={`trunk ${initial.name} を削除しますか？`}
            formAction={deleteAction}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            削除
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}
