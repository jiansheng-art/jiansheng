import { TRPCError } from '@trpc/server';
import { and, eq, gte } from 'drizzle-orm';
import z from 'zod';
import { db } from '~~/server/db';
import { contactForms } from '~~/server/db/schema';
import { protectedProcedure, publicProcedure, router } from '~~/server/trpc/trpc';

const CONTACT_FORM_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const CONTACT_FORM_RATE_LIMIT_MAX_SUBMISSIONS = 3;

export const contactFormRouter = router({
  create: publicProcedure.input(z.object({
    firstName: z.string().min(1).max(255),
    lastName: z.string().min(1).max(255),
    email: z.email().max(255),
    subject: z.string().min(1).max(255),
    message: z.string().min(1).max(2000),
  }))
    .mutation(async ({ input, ctx }) => {
      const submittedAfter = new Date(Date.now() - CONTACT_FORM_RATE_LIMIT_WINDOW_MS);

      const fingerprint = await getRequestFingerprint(ctx.event);
      if (!fingerprint) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unable to determine request fingerprint',
        });
      }

      const recentByIp = await db.query.contactForms.findMany({
        where: and(
          eq(contactForms.requestFingerprint, fingerprint),
          gte(contactForms.createdAt, submittedAfter),
        ),
        columns: { id: true },
        limit: CONTACT_FORM_RATE_LIMIT_MAX_SUBMISSIONS,
      });

      if (recentByIp.length >= CONTACT_FORM_RATE_LIMIT_MAX_SUBMISSIONS) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many contact form submissions. Please try again later.',
        });
      }

      await db.insert(contactForms).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        subject: input.subject,
        message: input.message,
        requestFingerprint: fingerprint,
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
