import type { ReactNode } from 'react';

/** テーブル横スクロール + 枠（OpenPBX 監査/CDR 等） */
export function DataTableShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-200 bg-white ${className}`.trim()}>
      {children}
    </div>
  );
}
