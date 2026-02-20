import { TRPCError } from '@trpc/server';
import { desc, eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import z from 'zod';
import { db } from '~~/server/db';
import { workImages, works, workSeries } from '~~/server/db/schema';
import { protectedProcedure, publicProcedure, router } from '~~/server/trpc/trpc';

interface WorkListItem {
  id: number;
  description: string | null;
  title: string;
  titleEnglish: string | null;
  year: number | null;
  material: string | null;
  dimensions: string | null;
  seriesId: number | null;
  series: {
    id: number;
    title: string;
    titleEnglish: string | null;
    description: string | null;
  } | null;
  images: {
    id: number;
    workId: number | null;
    fileName: string | null;
    s3FileId: string;
    url?: string;
  }[];
}

interface SeriesListItem {
  id: number;
  title: string;
  titleEnglish: string | null;
  description: string | null;
  works: WorkListItem[];
}

async function attachImageUrls(workItems: WorkListItem[]) {
  const s3 = new S3Controller();
  for (const work of workItems) {
    for (const image of work.images) {
      image.url = await s3.getFileUrl(image.s3FileId);
    }
  }

  return workItems;
}

export const workRouter = router({
  createSeries: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      titleEnglish: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return (await db.insert(workSeries).values({
        title: input.title,
        titleEnglish: input.titleEnglish,
        description: input.description,
      }).returning())[0] ?? null;
    }),

  updateSeries: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      title: z.string().min(1),
      titleEnglish: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.update(workSeries).set({
        title: input.title,
        titleEnglish: input.titleEnglish,
        description: input.description,
      }).where(eq(workSeries.id, input.id));
    }),

  deleteSeries: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      await db.delete(workSeries).where(eq(workSeries.id, input.id));
    }),

  listSeries: publicProcedure
    .query(async () => {
      const res = await db.query.workSeries.findMany({
        orderBy: [desc(workSeries.id)],
        with: {
          works: {
            orderBy: [desc(works.id)],
            with: {
              images: true,
              series: true,
            },
            limit: 4,
          },
        },
      }) as unknown as SeriesListItem[];

      for (const series of res) {
        await attachImageUrls(series.works);
      }

      return res;
    }),

  getSeries: publicProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      const series = await db.query.workSeries.findFirst({
        where: eq(workSeries.id, input.id),
        with: {
          works: {
            orderBy: [desc(works.id)],
            with: {
              images: true,
              series: true,
            },
          },
        },
      }) as unknown as SeriesListItem | undefined;

      if (!series) {
        return null;
      }

      await attachImageUrls(series.works);
      return series;
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      titleEnglish: z.string().optional(),
      description: z.string().optional(),
      imageIds: z.array(z.number()),
      seriesId: z.number().int().positive().optional(),
      year: z.number().int().positive().optional(),
      material: z.string().optional(),
      dimensions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = (await db.insert(works).values({
        title: input.title,
        titleEnglish: input.titleEnglish,
        description: input.description,
        seriesId: input.seriesId,
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
      seriesId: z.number().int().positive().optional(),
      year: z.number().int().positive().optional(),
      material: z.string().optional(),
      dimensions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.update(works).set({
        title: input.title,
        titleEnglish: input.titleEnglish,
        description: input.description,
        seriesId: input.seriesId,
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
          series: true,
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
          series: true,
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
        seriesId: number | null;
        series: {
          id: number;
          title: string;
          titleEnglish: string | null;
          description: string | null;
        } | null;
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
          series: true,
        },
        limit: 5,
      });

      return await attachImageUrls(workRes as WorkListItem[]);
    }),

  list: publicProcedure
    .query(async () => {
      const workRes = await db.query.works.findMany({
        orderBy: [desc(works.id)],
        with: {
          images: true,
          series: true,
        },
      });

      return await attachImageUrls(workRes as WorkListItem[]);
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
