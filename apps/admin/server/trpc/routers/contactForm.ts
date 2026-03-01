import { eq } from 'drizzle-orm';
import z from 'zod';
import { db } from '~~/server/db';
import { contactForms } from '~~/server/db/schema';
import { protectedProcedure, router } from '~~/server/trpc/trpc';

export const contactFormRouter = router({
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
