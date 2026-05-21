/** Next.js 起動時に AMI 不要の定期タスクを開始 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensurePeriodicTasksOnBoot } = await import('./src/server/runtime/boot-tasks');
    ensurePeriodicTasksOnBoot();
  }
}
