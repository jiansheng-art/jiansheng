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
    .mutation(async () => {
      const s3 = new S3Controller();
      const s3FileId = nanoid(20);

      const id = (await db.insert(workImages).values({
        s3FileId,
      }).returning())[0].id;

      const url = await s3.getStandardUploadPresignedUrl(s3FileId);
      if (!url)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '无法获取文件上传URL' });
      return { id, url };
    }),
});
