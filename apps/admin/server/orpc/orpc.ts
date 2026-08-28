import { ORPCError, os } from '@orpc/server';

import type { Context } from './context';

const o = os.$context<Context>();

export const protectedProcedure = o.use(({ context, next }) => {
  if (!context.authSession || context.authSession.user.role !== 'admin') {
    throw new ORPCError('UNAUTHORIZED', { message: 'You are not logged in.' });
  }

  return next({
    context: {
      authSession: context.authSession,
    },
  });
});
