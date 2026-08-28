import { artActivityRouter } from './artActivity';
import { contactFormRouter } from './contactForm';
import { homeRouter } from './home';
import { orderRouter } from './order';
import { pageContentRouter } from './pageContent';
import { productRouter } from './product';
import { workRouter } from './work';

export const router = {
  artActivity: artActivityRouter,
  contactForm: contactFormRouter,
  order: orderRouter,
  pageContent: pageContentRouter,
  product: productRouter,
  work: workRouter,
  home: homeRouter,
};

export type AppRouter = typeof router;
