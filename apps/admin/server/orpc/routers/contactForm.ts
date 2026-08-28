import { db } from '@jiansheng/shared/db';
import { contactForms } from '@jiansheng/shared/schema';
import { eq } from 'drizzle-orm';
import z from 'zod';

import { protectedProcedure } from '../orpc';

export const contactFormRouter = {
  list: protectedProcedure.handler(async () => {
    const forms = await db.query.contactForms.findMany({
      orderBy: (form, { desc }) => [desc(form.createdAt)],
    });
    return forms;
  }),

  toggleRead: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .handler(async ({ input }) => {
      const form = await db.query.contactForms.findFirst({
        where: eq(contactForms.id, input.id),
      });
      if (form) {
        await db
          .update(contactForms)
          .set({ unread: !form.unread })
          .where(eq(contactForms.id, input.id));
      }
    }),

  toggleStarred: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .handler(async ({ input }) => {
      const form = await db.query.contactForms.findFirst({
        where: eq(contactForms.id, input.id),
      });
      if (form) {
        await db
          .update(contactForms)
          .set({ starred: !form.starred })
          .where(eq(contactForms.id, input.id));
      }
    }),
};
