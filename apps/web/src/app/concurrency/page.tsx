import { guardPage } from '@/lib/auth';
import { formatJst } from '@/lib/datetime';
import { getConcurrencyForUi } from '@/server/page-data';
import { PageHeader } from '@/components/PageHeader';
import { PageSection } from '@/components/PageSection';
import { DataTableShell } from '@/components/DataTableShell';

export const dynamic = 'force-dynamic';

export default async function ConcurrencyPage() {
  await guardPage('user');
  const { currentChannels, bars, maxChannels } = await getConcurrencyForUi();
  return (
    <div className="space-y-4">
      <PageHeader
        title="同時通話数"
        description="AMI から取得した端末状態をもとに、30 秒ごとに集計した分単位のスナップショット。"
      />

      <PageSection>
        <div className="text-sm">
          現在の同時通話数:{' '}
          <span className="font-mono text-2xl font-bold tabular-nums">
            {currentChannels === null ? '—' : currentChannels}
          </span>
          <span className="ml-4 text-slate-500">
            直近スナップショット最大:{' '}
            <span className="font-bold tabular-nums">{maxChannels}</span>
          </span>
        </div>
      </PageSection>

      {bars.length > 0 && (
        <PageSection title={`直近 ${bars.length} 分 (ピーク ${maxChannels})`}>
          <div
            className="flex h-32 items-end gap-px overflow-x-auto"
            aria-label="同時通話数グラフ"
          >
            {bars.map((b) => (
              <div
                key={b.minuteAt}
                title={`${formatJst(b.minuteAt)}: ${b.channels}`}
                className="min-w-[3px] flex-1 rounded-t bg-blue-500/80"
                style={{ height: `${b.heightPct}%` }}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-400">30 秒ごとに AMI から記録（左が古い）</p>
        </PageSection>
      )}

      <PageSection title="スナップショット一覧">
        <DataTableShell>
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-1 text-left" scope="col">
                  時刻
                </th>
                <th className="px-2 py-1 text-left" scope="col">
                  同時
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[...bars].reverse().slice(0, 48).map((b) => (
                <tr key={b.minuteAt}>
                  <td className="px-2 py-1 font-mono">{formatJst(b.minuteAt)}</td>
                  <td className="px-2 py-1 tabular-nums">{b.channels}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </PageSection>
    </div>
  );
}
