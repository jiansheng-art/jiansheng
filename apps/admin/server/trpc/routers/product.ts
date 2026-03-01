import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import Stripe from 'stripe';
import z from 'zod';
import { db } from '~~/server/db';
import { productImages, products } from '~~/server/db/schema';
import { env } from '~~/server/env';
import { protectedProcedure, router } from '~~/server/trpc/trpc';
import { S3Controller } from '~~/server/utils/s3';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const CAD_CURRENCY = 'cad';

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
  const s3 = new S3Controller();
  for (const product of productItems) {
    for (const image of product.images) {
      image.url = s3.getPermanentFileUrl(image.s3FileId);
    }
  }

  return productItems;
}

async function syncStripeProductImages(productId: number, stripeProductId: string) {
  const images = await db.query.productImages.findMany({
    where: eq(productImages.productId, productId),
  });

  const s3 = new S3Controller();
  const imageUrls = images.map(image => s3.getPermanentFileUrl(image.s3FileId));

  await stripe.products.update(stripeProductId, {
    images: imageUrls,
  });
}

export const productRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().max(2000).optional(),
      workId: z.number().int().positive().nullable().optional(),
      active: z.boolean().optional(),
      unitAmount: z.number().int().nonnegative(),
      metadata: z.record(z.string(), z.string()).optional(),
      imageIds: z.array(z.number().int().positive()).optional(),
    }))
    .mutation(async ({ input }) => {
      const stripeProduct = await stripe.products.create({
        name: input.name,
        description: input.description,
        active: input.active,
        metadata: input.metadata,
      });

      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: input.unitAmount,
        currency: CAD_CURRENCY,
        active: input.active,
      });

      let product: typeof products.$inferSelect | undefined;

      try {
        product = (await db.insert(products).values({
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id,
          workId: input.workId,
          name: input.name,
          description: input.description,
          active: input.active,
          unitAmount: input.unitAmount,
          currency: CAD_CURRENCY,
          metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
        }).returning())[0];
      }
      catch {
        await stripe.prices.update(stripePrice.id, { active: false });
        await stripe.products.update(stripeProduct.id, { active: false });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create product' });
      }

      if (!product) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create product' });
      }

      if (input.imageIds?.length) {
        for (const imageId of input.imageIds) {
          await db.update(productImages).set({
            productId: product.id,
          }).where(eq(productImages.id, imageId));
        }

        await syncStripeProductImages(product.id, stripeProduct.id);
      }

      return product;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(10000).nullable().optional(),
      workId: z.number().int().positive().nullable().optional(),
      active: z.boolean().optional(),
      unitAmount: z.number().int().nonnegative().nullable().optional(),
      metadata: z.record(z.string(), z.string()).nullable().optional(),
      imageIds: z.array(z.number().int().positive()).optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.query.products.findFirst({
        where: eq(products.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
      }

      const nextStripeProductId = existing.stripeProductId;
      const nextUnitAmount = input.unitAmount === undefined ? existing.unitAmount : input.unitAmount;

      await stripe.products.update(nextStripeProductId, {
        name: input.name,
        description: input.description === null ? '' : input.description,
        active: input.active,
        metadata: input.metadata ?? undefined,
      });

      let stripePriceId = existing.stripePriceId;
      if (input.unitAmount !== undefined || input.active !== undefined) {
        if (nextUnitAmount == null) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'unitAmount is required to create a Stripe price' });
        }

        const stripePrice = await stripe.prices.create({
          product: nextStripeProductId,
          unit_amount: nextUnitAmount,
          currency: CAD_CURRENCY,
          active: input.active ?? existing.active,
        });
        stripePriceId = stripePrice.id;
      }

      await db.update(products).set({
        stripePriceId,
        name: input.name,
        description: input.description,
        workId: input.workId,
        active: input.active,
        unitAmount: input.unitAmount,
        currency: CAD_CURRENCY,
        metadata: input.metadata === undefined ? undefined : input.metadata === null ? null : JSON.stringify(input.metadata),
      }).where(eq(products.id, input.id));

      if (input.imageIds) {
        await db.update(productImages).set({
          productId: null,
        }).where(eq(productImages.productId, input.id));

        for (const imageId of input.imageIds) {
          await db.update(productImages).set({
            productId: input.id,
          }).where(eq(productImages.id, imageId));
        }

        await syncStripeProductImages(input.id, nextStripeProductId);
      }
    }),

  delete: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.query.products.findFirst({
        where: eq(products.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
      }

      const existingImages = await db.query.productImages.findMany({
        where: eq(productImages.productId, input.id),
      });

      const s3 = new S3Controller();
      await Promise.all(existingImages.map(image => s3.deleteFile(image.s3FileId)));

      if (existing.stripePriceId) {
        await stripe.prices.update(existing.stripePriceId, { active: false });
      }
      await stripe.products.update(existing.stripeProductId, { active: false });

      await db.delete(products).where(eq(products.id, input.id));
    }),

  list: protectedProcedure
    .query(async () => {
      const productsRes = await db.query.products.findMany({
        orderBy: [desc(products.id)],
        with: {
          images: true,
        },
      }) as ProductListItem[];

      return await attachImageUrls(productsRes);
    }),

  createImage: protectedProcedure
    .input(z.object({
      fileName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const s3 = new S3Controller();
      const s3FileId = nanoid(20);

      const id = (await db.insert(productImages).values({
        s3FileId,
        fileName: input.fileName || null,
      }).returning())[0]?.id;

      const url = await s3.getStandardUploadPresignedUrl(s3FileId);
      if (!url)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to get upload URL' });

      return { id, url };
    }),

  deleteImage: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const image = await db.query.productImages.findFirst({
        where: eq(productImages.id, input.id),
      });

      if (!image) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product image not found' });
      }

      let stripeProductId: string | null = null;
      if (image.productId) {
        const product = await db.query.products.findFirst({
          where: eq(products.id, image.productId),
        });

        if (product) {
          stripeProductId = product.stripeProductId;
        }
      }

      await new S3Controller().deleteFile(image.s3FileId);
      await db.delete(productImages).where(eq(productImages.id, input.id));

      if (image.productId && stripeProductId) {
        await syncStripeProductImages(image.productId, stripeProductId);
      }
    }),

});
