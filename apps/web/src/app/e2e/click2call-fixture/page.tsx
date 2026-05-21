import { guardPage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** G5b E2E: content script が tel: を拾う最小 fixture */
export default async function Click2CallFixturePage() {
  await guardPage('user');
  return (
    <div className="space-y-2 p-4">
      <h2 className="text-lg font-semibold">Click-to-call E2E fixture</h2>
      <p>
        電話は <a href="tel:0312345678">03-1234-5678</a> へ
      </p>
    </div>
  );
}
