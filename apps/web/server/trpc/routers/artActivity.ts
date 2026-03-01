import { desc } from 'drizzle-orm';
import { db } from '~~/server/db';
import { artActivities } from '~~/server/db/schema';
import { publicProcedure, router } from '~~/server/trpc/trpc';

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

});
