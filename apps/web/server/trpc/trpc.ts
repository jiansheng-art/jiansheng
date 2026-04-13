import type { Context } from './context';
import { transformer } from '@jiansheng/shared/transformer';
import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { MemoryStore } from '../utils/store';

const t = initTRPC.context<Context>().create({
  transformer,

  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause
            : null,
      },
    };
  },
});

const store = new MemoryStore({ windowMs: 30 * 1000 }); // 30 seconds

const rateLimiter = t.middleware(async ({ ctx, next }) => {
  const { totalHits, resetTime } = await store.increment(ctx.fingerprint);

  if (totalHits > 1) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `You have exceeded the maximum number of requests. Please try again after ${Math.ceil((resetTime.getTime() - Date.now()) / 1000)} seconds.`,
    });
  }

  return next();
});

/**
 * Unprotected procedure
 */
export const router = t.router;
export const middleware = t.middleware;

export const publicProcedure = t.procedure;
export const rateLimitedPublicProcedure = publicProcedure.use(rateLimiter);
