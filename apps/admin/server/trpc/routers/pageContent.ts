import { inArray } from 'drizzle-orm';
import z from 'zod';
import { db } from '~~/server/db';
import { pageContents } from '~~/server/db/schema';
import { env } from '~~/server/env';
import { protectedProcedure, router } from '~~/server/trpc/trpc';

const PAGE_SLUGS = ['about', 'contact'] as const;
const pageSlugSchema = z.enum(PAGE_SLUGS);

type PageSlug = z.infer<typeof pageSlugSchema>;

const defaultPageContent: Record<PageSlug, { title: string; description: string; markdown: string }> = {
  about: {
    title: 'About',
    description: 'Learn more about Zhang Jiansheng and his art practice.',
    markdown: '# About\n\nThis page is currently being updated.',
  },
  contact: {
    title: 'Contact',
    description: 'Get in touch with Zhang Jiansheng Art for inquiries and collaborations.',
    markdown: `### Contact Me

I'd love to hear from you! Whether you have a project you'd like to discuss, a collaboration opportunity, or just want to say hello, feel free to reach out. I'm always interested in exploring new ideas and connecting with like-minded people.`,
  },
};

async function ensureDefaultPages() {
  const existing = await db.query.pageContents.findMany({
    where: inArray(pageContents.slug, PAGE_SLUGS),
  });

  const existingSlugs = new Set(existing.map(item => item.slug));
  const missingSlugs = PAGE_SLUGS.filter(slug => !existingSlugs.has(slug));

  if (!missingSlugs.length) {
    return;
  }

  await db.insert(pageContents).values(
    missingSlugs.map(slug => ({
      slug,
      title: defaultPageContent[slug].title,
      description: defaultPageContent[slug].description,
      markdown: defaultPageContent[slug].markdown,
    })),
  );
}

export const pageContentRouter = router({
  list: protectedProcedure
    .query(async () => {
      await ensureDefaultPages();

      return await db.query.pageContents.findMany({
        where: inArray(pageContents.slug, PAGE_SLUGS),
      });
    }),

  upsert: protectedProcedure
    .input(z.object({
      slug: pageSlugSchema,
      title: z.string().min(1).max(255),
      description: z.string().max(2000).optional(),
      markdown: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      await db.transaction(async (tx) => {
        const record = {
          slug: input.slug,
          title: input.title,
          description: input.description ?? null,
          markdown: input.markdown,
        };

        await tx
          .insert(pageContents)
          .values(record)
          .onConflictDoUpdate({
            target: pageContents.slug,
            set: {
              title: record.title,
              description: record.description,
              markdown: record.markdown,
              updatedAt: new Date(),
            },
          });

        if (env.VERCEL_BUILD_HOOK_URL) {
          // Trigger vercel build hook to update pre-rendered pages
          await fetch(env.VERCEL_BUILD_HOOK_URL, {
            method: 'POST',
          });
        }
      });
    }),
});
