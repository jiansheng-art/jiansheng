import type { Context } from './context';
import { transformer } from '@jiansheng/shared/transformer';
import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

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

export const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.authSession || ctx.authSession.user.role !== 'admin')
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You are not logged in.' });

  return next({
    ctx: {
      authSession: ctx.authSession,
    },
  });
});

export const router = t.router;
export const middleware = t.middleware;

// export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
