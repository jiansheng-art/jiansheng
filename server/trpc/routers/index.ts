import { z } from 'zod';
import { db } from '~~/server/db';
import { contactFormRouter } from '~~/server/trpc/routers/contactForm';
import { userRouter } from '~~/server/trpc/routers/user';
import { workRouter } from '~~/server/trpc/routers/work';
import { publicProcedure, router } from '../trpc';

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({
      text: z.string().nullish(),
    }))
    .query(async ({ input }) => {
      const res = await db.query.users.findMany();
      return {
        greeting: input.text,
        users: res,
      };
    }),

  contactForm: contactFormRouter,
  work: workRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
