import { db } from '@jiansheng/shared/db';
import { contactForms, products, works, workSeries } from '@jiansheng/shared/schema';
import { count, eq } from 'drizzle-orm';
import { protectedProcedure, router } from '~~/server/trpc/trpc';

export const homeRouter = router({
  counter: protectedProcedure
    .query(async () => {
      const workCount = await db.select({ count: count() }).from(works);
      const seriesCount = await db.select({ count: count() }).from(workSeries);
      const productCount = await db.select({ count: count() }).from(products);
      const contactFormCount = await db.select({ count: count() }).from(contactForms).where(eq(contactForms.unread, true));

      return {
        workCount: workCount[0]?.count,
        seriesCount: seriesCount[0]?.count,
        productCount: productCount[0]?.count,
        contactFormCount: contactFormCount[0]?.count,
      };
    }),
});
