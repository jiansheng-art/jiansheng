import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { db } from '~~/server/db';
import { accessTokens } from '~~/server/db/schema';
import { protectedProcedure, publicProcedure, router } from '~~/server/trpc/trpc';

export const userRouter = router({
  login: publicProcedure
    .input(z.object({
      name: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.name, input.name),
      });

      if (!user || !user.password || !await bcrypt.compare(input.password, user.password))
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid email or password.' });

      return await loginUser(user, undefined, ctx.userAgent);
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.token)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You are not logged in.' });

      await db
        .update(accessTokens)
        .set({ status: 'inactive' })
        .where(eq(accessTokens.token, ctx.token));
    }),
});
