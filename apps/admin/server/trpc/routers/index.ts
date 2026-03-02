import { artActivityRouter } from '~~/server/trpc/routers/artActivity';
import { contactFormRouter } from '~~/server/trpc/routers/contactForm';
import { orderRouter } from '~~/server/trpc/routers/order';
import { pageContentRouter } from '~~/server/trpc/routers/pageContent';
import { productRouter } from '~~/server/trpc/routers/product';
import { userRouter } from '~~/server/trpc/routers/user';
import { workRouter } from '~~/server/trpc/routers/work';
import { router } from '../trpc';

export const appRouter = router({
  artActivity: artActivityRouter,
  contactForm: contactFormRouter,
  order: orderRouter,
  pageContent: pageContentRouter,
  product: productRouter,
  work: workRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
