import { env } from '@jiansheng/shared/env';

export async function triggerVercelBuild() {
  if (env.VERCEL_BUILD_HOOK_URL) {
    // Trigger vercel build hook to update pre-rendered pages
    await fetch(env.VERCEL_BUILD_HOOK_URL, {
      method: 'POST',
    });
  }
}
