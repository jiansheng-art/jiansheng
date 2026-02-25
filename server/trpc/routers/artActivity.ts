import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import z from 'zod';
import { db } from '~~/server/db';
import { artActivities, artActivityImages } from '~~/server/db/schema';
import { protectedProcedure, publicProcedure, router } from '~~/server/trpc/trpc';

interface ActivityListItem {
  id: number;
  title: string;
  description: string | null;
  markdown: string | null;
  date: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  images: {
    id: number;
    activityId: number | null;
    fileName: string | null;
    s3FileId: string;
    url?: string;
  }[];
}

async function attachImageUrls(items: ActivityListItem[]) {
  const s3 = new S3Controller();
  for (const item of items) {
    for (const image of item.images) {
      image.url = await s3.getFileUrl(image.s3FileId);
    }
  }
  return items;
}

export const artActivityRouter = router({
  list: publicProcedure
    .query(async () => {
      const res = await db.query.artActivities.findMany({
        orderBy: [desc(artActivities.date), desc(artActivities.id)],
        with: {
          images: true,
        },
      });
      return await attachImageUrls(res as ActivityListItem[]);
    }),

  get: publicProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      const activity = await db.query.artActivities.findFirst({
        where: eq(artActivities.id, input.id),
        with: {
          images: true,
        },
      });

      if (!activity)
        return null;

      const result = activity as unknown as ActivityListItem;
      const s3 = new S3Controller();
      for (const image of result.images) {
        image.url = await s3.getFileUrl(image.s3FileId);
      }
      return result;
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      markdown: z.string().optional(),
      date: z.date().optional(),
      imageIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const id = (await db.insert(artActivities).values({
        title: input.title,
        description: input.description,
        date: input.date,
      }).returning())[0]?.id;

      for (const fileId of input.imageIds) {
        await db.update(artActivityImages).set({
          activityId: id,
        }).where(eq(artActivityImages.id, fileId));
      }

      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      title: z.string().min(1),
      description: z.string().optional(),
      markdown: z.string().optional(),
      date: z.date().optional(),
      imageIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input }) => {
      await db.update(artActivities).set({
        title: input.title,
        description: input.description,
        markdown: input.markdown,
        date: input.date,
      }).where(eq(artActivities.id, input.id));

      if (input.imageIds) {
        for (const fileId of input.imageIds) {
          await db.update(artActivityImages).set({
            activityId: input.id,
          }).where(eq(artActivityImages.id, fileId));
        }
      }
    }),

  delete: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const activity = await db.query.artActivities.findFirst({
        where: eq(artActivities.id, input.id),
        with: {
          images: true,
        },
      });

      if (!activity) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '活动未找到' });
      }

      const s3 = new S3Controller();
      await Promise.all(activity.images.map(image => s3.deleteFile(image.s3FileId)));

      await db.delete(artActivities).where(eq(artActivities.id, input.id));
    }),

  createImage: protectedProcedure
    .input(z.object({
      fileName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const s3 = new S3Controller();
      const s3FileId = nanoid(20);

      const id = (await db.insert(artActivityImages).values({
        s3FileId,
        fileName: input.fileName || null,
      }).returning())[0]?.id;

      const url = await s3.getStandardUploadPresignedUrl(s3FileId);
      if (!url)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '无法获取文件上传URL' });
      return { id, url };
    }),

  deleteImage: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const image = await db.query.artActivityImages.findFirst({
        where: eq(artActivityImages.id, input.id),
      });
      if (!image) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '图片未找到' });
      }

      const s3 = new S3Controller();
      await s3.deleteFile(image.s3FileId);

      await db.delete(artActivityImages).where(eq(artActivityImages.id, input.id));
    }),
});
