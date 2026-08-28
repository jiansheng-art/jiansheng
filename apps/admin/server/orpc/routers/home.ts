import { db } from '@jiansheng/shared/db';
import { contactForms, products, works, workSeries } from '@jiansheng/shared/schema';
import { count, eq } from 'drizzle-orm';

import { protectedProcedure } from '../orpc';

export const homeRouter = {
  counter: protectedProcedure.handler(async () => {
    const [workCount, seriesCount, productCount, contactFormCount] = await Promise.all([
      db.select({ count: count() }).from(works),
      db.select({ count: count() }).from(workSeries),
      db.select({ count: count() }).from(products),
      db.select({ count: count() }).from(contactForms).where(eq(contactForms.unread, true)),
    ]);

    return {
      workCount: workCount[0]?.count,
      seriesCount: seriesCount[0]?.count,
      productCount: productCount[0]?.count,
      contactFormCount: contactFormCount[0]?.count,
    };
  }),
};
