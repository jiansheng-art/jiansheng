import type { Context } from './context';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

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

/**
 * Unprotected procedure
 */
export const router = t.router;
export const middleware = t.middleware;

export const publicProcedure = t.procedure;
export const protectedProcedure = publicProcedure.use(enforceUserIsAuthed);
