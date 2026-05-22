import { getExtensions } from '@/server/page-data';
import { guardPage } from '@/lib/auth';
import {
  createExtensionAction,
  updateExtensionAction,
  deleteExtensionAction,
} from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
import { PageHeader } from '@/components/PageHeader';
import { PageSection } from '@/components/PageSection';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ExtensionsPage() {
  const me = await guardPage('user');
  const canViewSecret = me.role === 'admin';
  const canWrite = me.role === 'supervisor' || me.role === 'admin';
  const items = getExtensions().map((e) => ({
    ...e,
    secretDisplay: canViewSecret ? e.secret : null,
  }));
  return (
    <div className="space-y-6">
      <PageHeader
        title="内線端末管理"
        description="追加・編集・削除した内線は Asterisk に自動 reload されます。Groundwire 等の SIP クライアントから「Server: Mac の IP」「Username/Auth Username: 内線番号」「Password: secret」で登録してください。"
      />

      {canWrite && (
        <PageSection title="新規追加">
          <ExtensionForm action={createExtensionAction} submitLabel="追加" canViewSecret={canViewSecret} />
        </PageSection>
      )}

      <PageSection title={`登録済み (${items.length})`}>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">まだ内線が登録されていません。</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {items.map((e) => (
              <li key={e.number} className="py-3">
                <ExtensionForm
                  action={updateExtensionAction}
                  initial={e}
                  submitLabel="保存"
                  deleteAction={canWrite ? deleteExtensionAction : undefined}
                  canViewSecret={canViewSecret}
                  readOnly={!canWrite}
                />
              </li>
            ))}
          </ul>
        )}
      </PageSection>
    </div>
  );
}

interface ExtensionFormProps {
  action: (formData: FormData) => Promise<void>;
  initial?: {
    number: string;
    displayName: string | null;
    secretDisplay: string | null;
    note: string | null;
    webrtc?: boolean;
  };
  submitLabel: string;
  deleteAction?: (formData: FormData) => Promise<void>;
  canViewSecret: boolean;
  readOnly?: boolean;
}

function ExtensionForm({
  action,
  initial,
  submitLabel,
  deleteAction,
  canViewSecret,
  readOnly = false,
}: ExtensionFormProps) {
  const isEdit = !!initial;
  const secretRequired = !isEdit || canViewSecret;
  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr_1fr_1fr_auto]">
      <label className="text-xs text-slate-600">
        内線番号
        <input
          name="number"
          required
          defaultValue={initial?.number ?? ''}
          readOnly={isEdit || readOnly}
          inputMode="numeric"
          pattern="[0-9]{2,6}"
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm read-only:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 1003"
          aria-label="内線番号"
        />
      </label>
      <label className="text-xs text-slate-600">
        表示名
        <input
          name="displayName"
          defaultValue={initial?.displayName ?? ''}
          readOnly={readOnly}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm read-only:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: Nurse 1003"
        />
      </label>
      <label className="text-xs text-slate-600">
        パスワード (secret)
        <input
          name="secret"
          required={secretRequired}
          minLength={secretRequired ? 4 : undefined}
          defaultValue={initial?.secretDisplay ?? ''}
          readOnly={readOnly}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm read-only:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={isEdit && !canViewSecret ? '変更時のみ入力' : '4 文字以上'}
        />
      </label>
      <label className="text-xs text-slate-600">
        メモ
        <input
          name="note"
          defaultValue={initial?.note ?? ''}
          readOnly={readOnly}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm read-only:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="任意"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-slate-600 sm:col-span-5">
        <input
          type="checkbox"
          name="webrtc"
          defaultChecked={initial?.webrtc ?? false}
          disabled={readOnly}
          className="h-4 w-4"
        />
        WebRTC を有効化 (/softphone でブラウザ電話)
      </label>
      {!readOnly && (
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-md border border-slate-300 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {submitLabel}
          </button>
          {isEdit && deleteAction && (
            <ConfirmButton
              confirmText={`内線 ${initial.number} を削除しますか？`}
              formAction={deleteAction}
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={`内線 ${initial.number} を削除`}
            >
              削除
            </ConfirmButton>
          )}
        </div>
      )}
    </form>
  );
}
