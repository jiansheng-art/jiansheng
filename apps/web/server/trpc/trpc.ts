import type { Context } from './context';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { MemoryStore } from '../utils/store';

const t = initTRPC.context<Context>().create({
  transformer: superjson,

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

export const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user)
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You are not logged in.' });

  return next({
    ctx: {
      user: ctx.user,
    },
  });
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
export const protectedProcedure = publicProcedure.use(enforceUserIsAuthed);

export const rateLimitedPublicProcedure = publicProcedure.use(rateLimiter);
