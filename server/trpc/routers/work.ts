import { TRPCError } from '@trpc/server';
import { desc, eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import z from 'zod';
import { db } from '~~/server/db';
import { workImages, works } from '~~/server/db/schema';
import { protectedProcedure, publicProcedure, router } from '~~/server/trpc/trpc';

export const workRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      titleEnglish: z.string().optional(),
      description: z.string().optional(),
      imageIds: z.array(z.number()),
      year: z.number().int().positive().optional(),
      material: z.string().optional(),
      dimensions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = (await db.insert(works).values({
        title: input.title,
        titleEnglish: input.titleEnglish,
        description: input.description,
        year: input.year,
        material: input.material,
        dimensions: input.dimensions,
      }).returning())[0]?.id;

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
      titleEnglish: z.string().optional(),
      description: z.string().optional(),
      imageIds: z.array(z.number()).optional(),
      year: z.number().int().positive().optional(),
      material: z.string().optional(),
      dimensions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.update(works).set({
        title: input.title,
        titleEnglish: input.titleEnglish,
        description: input.description,
        year: input.year,
        material: input.material,
        dimensions: input.dimensions,
      }).where(eq(works.id, input.id));

      if (input.imageIds) {
        for (const fileId of input.imageIds) {
          await db.update(workImages).set({
            workId: input.id,
          }).where(eq(workImages.id, fileId));
        }
      }
    }),

  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const work = await db.query.works.findFirst({
        where: eq(works.id, input.id),
        with: {
          images: true,
        },
      });

      if (!work) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '作品未找到' });
      }

      const s3 = new S3Controller();
      await Promise.all(work.images.map(image => s3.deleteFile(image.s3FileId)));

      await db.delete(works).where(eq(works.id, input.id));
    }),

  get: publicProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      const work = await db.query.works.findFirst({
        where: eq(works.id, input.id),
        with: {
          images: true,
        },
      });

      if (!work) {
        return null;
      }

      const result: {
        id: number;
        description: string | null;
        title: string;
        titleEnglish: string | null;
        year: number | null;
        material: string | null;
        dimensions: string | null;
        images: {
          id: number;
          workId: number | null;
          fileName: string | null;
          s3FileId: string;
          url?: string;
        }[];
      } = work;

      for (const image of result.images) {
        image.url = await new S3Controller().getFileUrl(image.s3FileId);
      }

      return result;
    }),

  listHome: publicProcedure
    .query(async () => {
      const workRes = await db.query.works.findMany({
        orderBy: [sql`RANDOM()`],
        with: {
          images: true,
        },
        limit: 5,
      });

      const res: {
        id: number;
        description: string | null;
        title: string;
        titleEnglish: string | null;
        year: number | null;
        material: string | null;
        dimensions: string | null;
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
        description: string | null;
        title: string;
        titleEnglish: string | null;
        year: number | null;
        material: string | null;
        dimensions: string | null;
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
      }).returning())[0]?.id;

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
