import { desc, eq, sql } from 'drizzle-orm';
import z from 'zod';
import { db } from '~~/server/db';
import { works, workSeries } from '~~/server/db/schema';
import { publicProcedure, router } from '~~/server/trpc/trpc';

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

});
