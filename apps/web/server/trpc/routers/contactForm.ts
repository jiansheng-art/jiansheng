import { db } from '@jiansheng/shared/db';
import { contactForms } from '@jiansheng/shared/schema';
import z from 'zod';
import { rateLimitedPublicProcedure, router } from '~~/server/trpc/trpc';

export const contactFormRouter = router({
  create: rateLimitedPublicProcedure
    .input(z.object({
      firstName: z.string().min(1).max(255),
      lastName: z.string().min(1).max(255),
      email: z.email().min(1).max(255),
      subject: z.string().min(1).max(255),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input }) => {
      await db.insert(contactForms).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        subject: input.subject,
        message: input.message,
      });
    }),
});
