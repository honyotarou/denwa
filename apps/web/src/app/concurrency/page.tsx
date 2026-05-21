import { guardPage } from '@/lib/auth';
import { formatJst } from '@/lib/datetime';
import { getConcurrencyForUi } from '@/server/page-data';

export const dynamic = 'force-dynamic';

export default async function ConcurrencyPage() {
  await guardPage('user');
  const { currentChannels, bars, maxChannels } = await getConcurrencyForUi();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">同時通話</h2>
      <p className="text-sm text-slate-600">
        現在:{' '}
        <span className="font-bold tabular-nums">
          {currentChannels === null ? '—' : currentChannels}
        </span>
        <span className="ml-4 text-slate-500">
          直近スナップショット最大: <span className="font-bold tabular-nums">{maxChannels}</span>
        </span>
      </p>
      {bars.length > 0 && (
        <div className="rounded border bg-white p-4" aria-label="同時通話グラフ">
          <div className="flex h-32 items-end gap-0.5">
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
        </div>
      )}
      <table className="w-full rounded border bg-white text-sm">
        <thead>
          <tr className="text-slate-500">
            <th>時刻</th>
            <th>同時</th>
          </tr>
        </thead>
        <tbody>
          {[...bars].reverse().slice(0, 48).map((b) => (
            <tr key={b.minuteAt} className="border-t">
              <td>{formatJst(b.minuteAt)}</td>
              <td className="tabular-nums">{b.channels}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
