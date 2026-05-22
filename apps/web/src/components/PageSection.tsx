import type { ReactNode } from 'react';

/** 白カードセクション（OpenPBX 共通枠） */
export function PageSection({
  title,
  children,
  className = '',
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`.trim()}>
      {title ? <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3> : null}
      {children}
    </section>
  );
}
