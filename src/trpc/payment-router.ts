import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { getPayloadClient } from "../get-payload";
import { privateProdcedure, router } from "./trpc";
import { stripe } from "../lib/stripe";
import Stripe from "stripe";

export const paymentRouter = router({
  createSession: privateProdcedure
    .input(
      z.object({
        productIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      debugger;
      const { user } = ctx;
      let { productIds } = input;

      if (productIds.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const payload = await getPayloadClient();
      const { docs: products } = await payload.find({
        collection: "products",
        where: {
          id: {
            in: productIds,
          },
        },
      });

      const filteredProducts = products.filter((product) => Boolean(product.priceId));

      const order = await payload.create({
        collection: "orders",
        data: {
          _isPaid: false,
          products: filteredProducts.map((item) => item.id.toString()),
          user: user.id,
        },
      });

      const line_times: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      line_times.push({
        price: "price_1OdWcDCItkz2Znd6dNoleWKv",
        quantity: 1,
        adjustable_quantity: {
          enabled: false,
        },
      });

      filteredProducts.forEach((product) => {
        line_times.push({
          price: product.priceId!,
          quantity: 1,
        });
      });

      try {
        const stripeSession = await stripe.checkout.sessions.create({
          success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/cart`,
          payment_method_types: ["card"],
          mode: "payment",
          metadata: {
            userId: user.id,
            orderId: order.id,
          },
          line_items: line_times,
        });

        return { url: stripeSession.url, error: null };
      } catch (e) {
        if (e instanceof Stripe.errors.StripeInvalidRequestError) {
          return { url: null, error: e.message };
        }
        return { url: null, error: e };
      }
    }),
  pollOrderStatus: privateProdcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { orderId } = input;
      const payload = await getPayloadClient();

      const { docs: orders } = await payload.find({
        collection: "orders",
        where: {
          id: {
            equals: orderId,
          },
        },
      });
      if (!orders.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const [order] = orders;
      return { isPaid: order._isPaid };
    }),
});
