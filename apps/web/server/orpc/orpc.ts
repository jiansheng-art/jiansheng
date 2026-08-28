import { ratelimit } from '@orpc/ratelimit';
import { MemoryRateLimiter } from '@orpc/ratelimit/memory';
import { os } from '@orpc/server';

import type { Context } from './context';

const limiter = new MemoryRateLimiter({ maxRequests: 1, window: 30_000 });
const o = os.$context<Context>();

export const publicProcedure = o;
export const rateLimitedPublicProcedure = o.use(
  ratelimit({
    limiter,
    key: ({ context }) => context.fingerprint,
  }),
);
