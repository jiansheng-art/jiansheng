import { createTRPCNuxtHandler } from 'trpc-nuxt/server';
import { createContext } from '../../trpc/context';
import { appRouter } from '../../trpc/routers';

// export API handler
export default createTRPCNuxtHandler({
  router: appRouter,
  createContext,

  responseMeta(opts) {
    const { errors, type } = opts;

    // checking that no procedures errored
    const allOk = errors.length === 0;
    // checking we're doing a query request
    const isQuery = type === 'query';

    if (allOk && isQuery) {
      const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

      return {
        headers: {
          'cache-control': `s-maxage=1, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`,
        },
      };
    }

    return {};
  },
});
