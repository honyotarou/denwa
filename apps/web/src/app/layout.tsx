import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { getCurrentAccount } from '@/lib/auth';
import { FlashBanner } from '@/components/FlashBanner';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Command Room PBX',
  description: 'Asterisk ベース PBX の設定ダッシュボード',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentAccount().catch(() => null);
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">
        {me && (
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
              <a
                href="/"
                className="rounded text-lg font-semibold tracking-tight hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Command Room PBX
              </a>
              <NavBar me={me} />
            </div>
          </header>
        )}
        <Suspense fallback={null}>
          <FlashBanner />
        </Suspense>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
