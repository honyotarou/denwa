import Link from 'next/link';

/** 概要ダッシュボード用カード（OpenPBX / FRONTEND-PLAN §3.5） */
export function StatCard({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  const inner = (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {hint ? <div className="text-[10px] text-slate-400">{hint}</div> : null}
    </div>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="block hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
