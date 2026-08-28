import { createRouterClient } from '@orpc/server';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { createContext } from '~~/server/orpc/context';
import { router } from '~~/server/orpc/routers';

export default defineNuxtPlugin(async () => {
  const event = useRequestEvent();
  const context = event ? await createContext(event) : { fingerprint: '127.0.0.1' };
  const client = createRouterClient(router, { context });

  return {
    provide: {
      orpc: createTanstackQueryUtils(client),
    },
  };
});
