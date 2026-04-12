import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import Stripe from 'stripe';
import z from 'zod';
import { db } from '~~/server/db';
import { products } from '~~/server/db/schema';
import { env } from '~~/server/env';
import { publicProcedure, router } from '~~/server/trpc/trpc';
import { s3 } from '~~/server/utils/s3';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

interface ProductListItem {
  id: number;
  stripeProductId: string;
  stripePriceId: string | null;
  workId: number | null;
  name: string;
  description: string | null;
  active: boolean;
  unitAmount: number | null;
  currency: string | null;
  metadata: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  images: {
    id: number;
    productId: number | null;
    fileName: string | null;
    s3FileId: string;
    url?: string;
  }[];
}

async function attachImageUrls(productItems: ProductListItem[]) {
  for (const product of productItems) {
    for (const image of product.images) {
      image.url = s3.getPermanentFileUrl(image.s3FileId);
    }
  }

  return productItems;
}

export const productRouter = router({
  get: publicProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      const product = await db.query.products.findFirst({
        where: eq(products.id, input.id),
        columns: {
          id: true,
          name: true,
          description: true,
          unitAmount: true,
          currency: true,
        },
        with: {
          images: {
            columns: {
              s3FileId: true,
            },
          },
        },
      }) as ProductListItem | undefined;

      if (!product) {
        return null;
      }

      await attachImageUrls([product]);
      return product;
    }),

  list: publicProcedure
    .query(async () => {
      const productsRes = await db.query.products.findMany({
        where: eq(products.active, true),
        orderBy: [desc(products.id)],
        columns: {
          id: true,
          name: true,
          currency: true,
          unitAmount: true,
        },
        with: {
          images: {
            columns: {
              s3FileId: true,
            },
            limit: 1,
          },
        },
      }) as ProductListItem[];

      return await attachImageUrls(productsRes);
    }),

  getRelated: publicProcedure
    .input(z.object({
      workId: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      const productsRes = await db.query.products.findMany({
        where: eq(products.workId, input.workId),
        orderBy: [desc(products.id)],
        columns: {
          id: true,
          name: true,
          currency: true,
          unitAmount: true,
        },
        with: {
          images: {
            columns: {
              s3FileId: true,
            },
            limit: 1,
          },
        },
      }) as ProductListItem[];

      return await attachImageUrls(productsRes);
    }),

  createCheckoutSession: publicProcedure
    .input(z.object({
      items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })).min(1),
    }))
    .mutation(async ({ input }) => {
      const productIds = input.items.map(item => item.productId);
      const dbProducts = await db.query.products.findMany({
        where: (p, { inArray }) => inArray(p.id, productIds),
      });

      const lineItems: { price: string; quantity: number }[] = [];

      for (const item of input.items) {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: `Product ${item.productId} not found` });
        }
        if (!product.active) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Product "${product.name}" is no longer available` });
        }
        if (!product.stripePriceId) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Product "${product.name}" has no price configured` });
        }

        lineItems.push({
          price: product.stripePriceId,
          quantity: item.quantity,
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'CN', 'JP', 'KR', 'TW', 'HK', 'SG'],
        },
        success_url: env.STRIPE_CHECKOUT_SUCCESS_URL,
        cancel_url: env.STRIPE_CHECKOUT_CANCEL_URL,
      });

      if (!session.url) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create checkout session' });
      }

      return { url: session.url };
    }),
});
