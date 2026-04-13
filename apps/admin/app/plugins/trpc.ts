import type { AppRouter } from '~~/server/trpc/routers';
import { transformer } from '@jiansheng/shared/transformer';
import { createTRPCNuxtClient, httpBatchLink } from 'trpc-nuxt/client';

export default defineNuxtPlugin(() => {
  const trpc = createTRPCNuxtClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        maxURLLength: 4000,
        transformer,
      }),
    ],
  });

  return {
    provide: {
      trpc,
    },
  };
});
