import z from 'zod';
import { db } from '~~/server/db';
import { contactForms } from '~~/server/db/schema';
import { publicProcedure, router } from '~~/server/trpc/trpc';

export const contactFormRouter = router({
  create: publicProcedure.input(z.object({
    firstName: z.string().min(1).max(255),
    lastName: z.string().min(1).max(255),
    email: z.email().max(255),
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
