import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import z from 'zod';
import { db } from '~~/server/db';
import { workImages, works } from '~~/server/db/schema';
import { protectedProcedure, publicProcedure, router } from '~~/server/trpc/trpc';

export const workRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      imageIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const id = (await db.insert(works).values({
        title: input.title,
        description: input.description,
      }).returning())[0].id;

      for (const fileId of input.imageIds) {
        await db.update(workImages).set({
          workId: id,
        }).where(eq(workImages.id, fileId));
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string(),
      description: z.string(),
      imageIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input }) => {
      await db.update(works).set({
        title: input.title,
        description: input.description,
      }).where(eq(works.id, input.id));

      if (input.imageIds) {
        for (const fileId of input.imageIds) {
          await db.update(workImages).set({
            workId: input.id,
          }).where(eq(workImages.id, fileId));
        }
      }
    }),

  list: publicProcedure
    .query(async () => {
      const workRes = await db.query.works.findMany({
        orderBy: [desc(works.id)],
        with: {
          images: true,
        },
      });

      const res: {
        id: number;
        description: string;
        title: string;
        images: {
          id: number;
          workId: number | null;
          fileName: string | null;
          s3FileId: string;
          url?: string;
        }[];
      }[] = workRes;

      for (const work of res) {
        for (const image of work.images) {
          image.url = await new S3Controller().getFileUrl(image.s3FileId);
        }
      }

      return res;
    }),

  createImage: protectedProcedure
    .input(z.object({
      fileName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const s3 = new S3Controller();
      const s3FileId = nanoid(20);

      const id = (await db.insert(workImages).values({
        s3FileId,
        fileName: input.fileName || null,
      }).returning())[0].id;

      const url = await s3.getStandardUploadPresignedUrl(s3FileId);
      if (!url)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '无法获取文件上传URL' });
      return { id, url };
    }),

  deleteImage: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const image = await db.query.workImages.findFirst({
        where: eq(workImages.id, input.id),
      });
      if (!image) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '图片未找到' });
      }

      const s3 = new S3Controller();
      await s3.deleteFile(image.s3FileId);

      await db.delete(workImages).where(eq(workImages.id, input.id));
    }),
});
