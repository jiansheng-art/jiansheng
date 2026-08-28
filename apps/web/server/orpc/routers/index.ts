import { artActivityRouter } from './artActivity';
import { contactFormRouter } from './contactForm';
import { pageContentRouter } from './pageContent';
import { productRouter } from './product';
import { workRouter } from './work';

export const router = {
  artActivity: artActivityRouter,
  contactForm: contactFormRouter,
  pageContent: pageContentRouter,
  product: productRouter,
  work: workRouter,
};

export type AppRouter = typeof router;
