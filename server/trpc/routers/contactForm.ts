import { eq } from 'drizzle-orm';
import z from 'zod';
import { db } from '~~/server/db';
import { contactForms } from '~~/server/db/schema';
import { protectedProcedure, publicProcedure, router } from '~~/server/trpc/trpc';

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

  list: protectedProcedure.query(async () => {
    const forms = await db.query.contactForms.findMany({
      orderBy: (form, { desc }) => [desc(form.createdAt)],
    });
    return forms;
  }),

  toggleRead: protectedProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ input }) => {
    const form = await db.query.contactForms.findFirst({
      where: eq(contactForms.id, input.id),
    });
    if (form) {
      await db.update(contactForms).set({ unread: !form.unread }).where(eq(contactForms.id, input.id));
    }
  }),

  toggleStarred: protectedProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ input }) => {
    const form = await db.query.contactForms.findFirst({
      where: eq(contactForms.id, input.id),
    });
    if (form) {
      await db.update(contactForms).set({ starred: !form.starred }).where(eq(contactForms.id, input.id));
    }
  }),
});
