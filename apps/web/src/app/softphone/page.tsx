import { guardPage } from '@/lib/auth';
import { getExtensions } from '@/server/page-data';
export const dynamic = 'force-dynamic';
export default async function SoftphonePage() {
  await guardPage('user');
  const exts = getExtensions().filter((e) => e.webrtc);
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">ソフトフォン (WebRTC)</h2>
      <p className="text-sm text-slate-600">sip.js 接続は Phase 8 で有効化します。WebRTC 対応内線: {exts.map((e) => e.number).join(', ') || 'なし'}</p>
      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">⚠️ 現在は UI のみです。通話登録は /devices で確認してください。</div>
    </div>
  );
}
