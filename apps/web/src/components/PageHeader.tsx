import type { ReactNode } from 'react';

/** ページ見出し（FRONTEND-PLAN §2.2） */
export function PageHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <header>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <div className="text-xs text-slate-500">{description}</div> : null}
    </header>
  );
}
