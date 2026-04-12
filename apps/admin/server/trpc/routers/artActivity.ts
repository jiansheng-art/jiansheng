import { db } from '@jiansheng/shared/db';
import { s3 } from '@jiansheng/shared/s3';
import { artActivities, artActivityImages } from '@jiansheng/shared/schema';
import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import z from 'zod';
import { protectedProcedure, router } from '~~/server/trpc/trpc';
import { triggerVercelBuild } from '~~/server/utils/vercelBuild';

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
  for (const item of items) {
    for (const image of item.images) {
      image.url = s3.getFileUrl(image.s3FileId);
    }
  }
  return items;
}

export const artActivityRouter = router({
  list: protectedProcedure
    .query(async () => {
      const res = await db.query.artActivities.findMany({
        orderBy: [desc(artActivities.date), desc(artActivities.id)],
        with: {
          images: true,
        },
      });
      return await attachImageUrls(res as ActivityListItem[]);
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
      return await db.transaction(async (tx) => {
        const id = (await tx.insert(artActivities).values({
          title: input.title,
          description: input.description,
          date: input.date,
        }).returning())[0]?.id;

        for (const fileId of input.imageIds) {
          await tx.update(artActivityImages).set({
            activityId: id,
          }).where(eq(artActivityImages.id, fileId));
        }

        await triggerVercelBuild();

        return { id };
      });
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
      await db.transaction(async (tx) => {
        await tx.update(artActivities).set({
          title: input.title,
          description: input.description,
          markdown: input.markdown,
          date: input.date,
        }).where(eq(artActivities.id, input.id));

        if (input.imageIds) {
          for (const fileId of input.imageIds) {
            await tx.update(artActivityImages).set({
              activityId: input.id,
            }).where(eq(artActivityImages.id, fileId));
          }
        }

        await triggerVercelBuild();
      });
    }),

  delete: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      await db.transaction(async (tx) => {
        const activity = await tx.query.artActivities.findFirst({
          where: eq(artActivities.id, input.id),
          with: {
            images: true,
          },
        });

        if (!activity) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '活动未找到' });
        }

        await Promise.all(activity.images.map(image => s3.deleteFile(image.s3FileId)));

        await tx.delete(artActivities).where(eq(artActivities.id, input.id));

        await triggerVercelBuild();
      });
    }),

  createImage: protectedProcedure
    .input(z.object({
      fileName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const s3FileId = nanoid(20);

      const id = (await db.insert(artActivityImages).values({
        s3FileId,
        fileName: input.fileName || null,
      }).returning())[0]?.id;

      const url = await s3.getUploadPresignedUrl(s3FileId);
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

      await s3.deleteFile(image.s3FileId);

      await db.delete(artActivityImages).where(eq(artActivityImages.id, input.id));
    }),
});
