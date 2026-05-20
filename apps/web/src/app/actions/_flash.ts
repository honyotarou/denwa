import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { mapActionError } from '@/lib/flash';

export async function flash(path: string, okMsg: string, fn: () => Promise<void>): Promise<never> {
  let errMsg: string | null = null;
  try {
    await fn();
  } catch (err) {
    errMsg = mapActionError(err);
    console.error(`[action] ${path}`, errMsg);
  }
  revalidatePath(path);
  const q = new URLSearchParams();
  if (errMsg) q.set('err', errMsg);
  else if (okMsg) q.set('ok', okMsg);
  redirect(q.toString() ? `${path}?${q.toString()}` : path);
}

export function formString(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}
