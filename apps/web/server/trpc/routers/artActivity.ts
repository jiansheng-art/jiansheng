import { db } from '@jiansheng/shared/db';
import { s3 } from '@jiansheng/shared/s3';
import { artActivities } from '@jiansheng/shared/schema';
import { desc } from 'drizzle-orm';
import { publicProcedure, router } from '~~/server/trpc/trpc';

export const artActivityRouter = router({
  list: publicProcedure
    .query(async () => {
      const res = await db.query.artActivities.findMany({
        orderBy: [desc(artActivities.date), desc(artActivities.id)],
        with: {
          images: true,
        },
      });

      return res.map(item => ({
        ...item,
        images: item.images.map(image => ({
          url: s3.getFileUrl(image.s3FileId),
        })),
      }));
    }),
});
