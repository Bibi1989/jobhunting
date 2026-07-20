import { l as defineEventHandler, p as requireUser, u as useRuntimeConfig, c as createError, x as getStripe, y as setStripeCustomerId } from '../../../nitro/nitro.mjs';
import '@google/genai';
import 'node:fs/promises';
import 'node:path';
import 'mammoth';
import 'cheerio';
import '@react-pdf/primitives';
import 'buffer';
import '@react-pdf/font';
import '@react-pdf/render';
import '@react-pdf/pdfkit';
import '@react-pdf/layout';
import '@react-pdf/fns';
import '@react-pdf/reconciler';
import 'node:stream';
import 'stripe';
import 'pg';
import 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';

const checkout_post = defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const config = useRuntimeConfig();
  const priceId = config.stripePriceProMonthly;
  if (!priceId) {
    throw createError({
      statusCode: 500,
      statusMessage: "Stripe price is not configured (STRIPE_PRICE_PRO_MONTHLY missing)"
    });
  }
  const stripe = getStripe();
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id }
    });
    customerId = customer.id;
    await setStripeCustomerId(user.id, customerId);
  }
  const appUrl = String(config.appUrl || "http://localhost:3000").replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id }
    }
  });
  if (!session.url) {
    throw createError({ statusCode: 500, statusMessage: "Failed to create Checkout session" });
  }
  return { url: session.url };
});

export { checkout_post as default };
//# sourceMappingURL=checkout.post.mjs.map
