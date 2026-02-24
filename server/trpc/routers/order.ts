import { eq, inArray } from 'drizzle-orm';
import Stripe from 'stripe';
import z from 'zod';
import { db } from '~~/server/db';
import { orderShipments } from '~~/server/db/schema';
import { env } from '~~/server/env';
import { protectedProcedure, router } from '~~/server/trpc/trpc';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const shippingStatusEnum = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

export const orderRouter = router({
  /**
   * List completed checkout sessions (purchases) from Stripe.
   * Supports cursor-based pagination.
   */
  list: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(25),
      startingAfter: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 25;

      const params: Stripe.Checkout.SessionListParams = {
        limit,
        status: 'complete',
        expand: ['data.line_items', 'data.customer'],
      };

      if (input?.startingAfter) {
        params.starting_after = input.startingAfter;
      }

      const sessions = await stripe.checkout.sessions.list(params);

      // Fetch local shipping status for all sessions in this page
      const sessionIds = sessions.data.map(s => s.id);
      const shipments = sessionIds.length
        ? await db.query.orderShipments.findMany({
            where: inArray(orderShipments.stripeSessionId, sessionIds),
          })
        : [];
      const shipmentMap = new Map(shipments.map(s => [s.stripeSessionId, s]));

      const orders = sessions.data.map((session) => {
        const customer = session.customer as Stripe.Customer | null;
        const shipping = session.collected_information?.shipping_details;
        const shipment = shipmentMap.get(session.id);

        return {
          id: session.id,
          amountTotal: session.amount_total,
          currency: session.currency,
          status: session.payment_status,
          customerEmail: session.customer_details?.email ?? customer?.email ?? null,
          customerName: session.customer_details?.name
            ?? shipping?.name
            ?? null,
          shippingAddress: shipping?.address
            ? formatAddress(shipping.address)
            : null,
          lineItems: (session.line_items?.data ?? []).map(item => ({
            description: item.description,
            quantity: item.quantity,
            amountTotal: item.amount_total,
          })),
          shippingStatus: shipment?.shippingStatus ?? 'pending',
          trackingNumber: shipment?.trackingNumber ?? null,
          carrier: shipment?.carrier ?? null,
          notes: shipment?.notes ?? null,
          shippedAt: shipment?.shippedAt ?? null,
          deliveredAt: shipment?.deliveredAt ?? null,
          createdAt: new Date(session.created * 1000),
        };
      });

      return {
        orders,
        hasMore: sessions.has_more,
        lastId: sessions.data.at(-1)?.id ?? null,
      };
    }),

  /**
   * Get a single checkout session by ID with full details.
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const session = await stripe.checkout.sessions.retrieve(input.id, {
        expand: ['line_items', 'customer', 'payment_intent'],
      });

      const customer = session.customer as Stripe.Customer | null;
      const shipping = session.collected_information?.shipping_details;
      const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;

      const shipment = await db.query.orderShipments.findFirst({
        where: eq(orderShipments.stripeSessionId, input.id),
      });

      return {
        id: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
        status: session.payment_status,
        paymentStatus: paymentIntent?.status ?? null,
        customerEmail: session.customer_details?.email ?? customer?.email ?? null,
        customerName: session.customer_details?.name
          ?? shipping?.name
          ?? null,
        customerPhone: session.customer_details?.phone ?? null,
        shippingAddress: shipping?.address
          ? formatAddress(shipping.address)
          : null,
        lineItems: (session.line_items?.data ?? []).map(item => ({
          description: item.description,
          quantity: item.quantity,
          amountTotal: item.amount_total,
        })),
        shippingStatus: shipment?.shippingStatus ?? 'pending',
        trackingNumber: shipment?.trackingNumber ?? null,
        carrier: shipment?.carrier ?? null,
        notes: shipment?.notes ?? null,
        shippedAt: shipment?.shippedAt ?? null,
        deliveredAt: shipment?.deliveredAt ?? null,
        createdAt: new Date(session.created * 1000),
      };
    }),

  /**
   * Update the shipping status for an order.
   * Creates the shipment record if it doesn't exist yet (upsert).
   */
  updateShipping: protectedProcedure
    .input(z.object({
      stripeSessionId: z.string().min(1),
      shippingStatus: shippingStatusEnum,
      trackingNumber: z.string().max(255).nullable().optional(),
      carrier: z.string().max(255).nullable().optional(),
      notes: z.string().max(2000).nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date();

      const existing = await db.query.orderShipments.findFirst({
        where: eq(orderShipments.stripeSessionId, input.stripeSessionId),
      });

      const shippedAt = input.shippingStatus === 'shipped' && !existing?.shippedAt ? now : existing?.shippedAt ?? null;
      const deliveredAt = input.shippingStatus === 'delivered' && !existing?.deliveredAt ? now : existing?.deliveredAt ?? null;

      if (existing) {
        await db.update(orderShipments).set({
          shippingStatus: input.shippingStatus,
          trackingNumber: input.trackingNumber !== undefined ? input.trackingNumber : existing.trackingNumber,
          carrier: input.carrier !== undefined ? input.carrier : existing.carrier,
          notes: input.notes !== undefined ? input.notes : existing.notes,
          shippedAt,
          deliveredAt,
        }).where(eq(orderShipments.id, existing.id));
      }
      else {
        await db.insert(orderShipments).values({
          stripeSessionId: input.stripeSessionId,
          shippingStatus: input.shippingStatus,
          trackingNumber: input.trackingNumber ?? null,
          carrier: input.carrier ?? null,
          notes: input.notes ?? null,
          shippedAt,
          deliveredAt,
        });
      }

      return { success: true };
    }),
});

function formatAddress(address: Stripe.Address): string {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
}
