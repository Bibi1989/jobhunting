import { l as defineEventHandler, u as useRuntimeConfig, c as createError, z as getHeader, A as readRawBody, x as getStripe, B as getUserByStripeCustomerId, C as getUserById, D as setPlanAndCredits, F as FREE_CREDITS, E as setStripeSubscriptionId, P as PRO_CREDITS } from '../../../nitro/nitro.mjs';
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

const webhook_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f;
  const config = useRuntimeConfig();
  const webhookSecret = config.stripeWebhookSecret;
  if (!webhookSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: "Stripe webhook secret is not configured"
    });
  }
  const signature = getHeader(event, "stripe-signature");
  if (!signature) {
    throw createError({ statusCode: 400, statusMessage: "Missing stripe-signature header" });
  }
  const rawBody = await readRawBody(event);
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: "Missing request body" });
  }
  const stripe = getStripe();
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] signature verification failed", error);
    throw createError({ statusCode: 400, statusMessage: "Invalid Stripe signature" });
  }
  try {
    switch (stripeEvent.type) {
      case "invoice.payment_succeeded": {
        const invoice = stripeEvent.data.object;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (_a = invoice.customer) == null ? void 0 : _a.id;
        if (!customerId) break;
        const user = await getUserByStripeCustomerId(customerId);
        if (!user) {
          console.warn(`[stripe webhook] no user for customer ${customerId}`);
          break;
        }
        const invoiceAny = invoice;
        const subscriptionId = typeof invoiceAny.subscription === "string" ? invoiceAny.subscription : ((_b = invoiceAny.subscription) == null ? void 0 : _b.id) || ((_d = (_c = invoiceAny.parent) == null ? void 0 : _c.subscription_details) == null ? void 0 : _d.subscription) || null;
        await setPlanAndCredits(user.id, "pro", PRO_CREDITS, "stripe_invoice_payment_succeeded");
        if (subscriptionId) {
          await setStripeSubscriptionId(user.id, subscriptionId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = stripeEvent.data.object;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : (_e = subscription.customer) == null ? void 0 : _e.id;
        if (!customerId) break;
        let user = await getUserByStripeCustomerId(customerId);
        if (!user && ((_f = subscription.metadata) == null ? void 0 : _f.userId)) {
          user = await getUserById(subscription.metadata.userId);
        }
        if (!user) {
          console.warn(`[stripe webhook] no user for deleted subscription ${subscription.id}`);
          break;
        }
        await setPlanAndCredits(user.id, "free", FREE_CREDITS, "stripe_subscription_deleted");
        await setStripeSubscriptionId(user.id, null);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe webhook] handler error", error);
    throw createError({ statusCode: 500, statusMessage: "Webhook handler failed" });
  }
  return { received: true };
});

export { webhook_post as default };
//# sourceMappingURL=webhook.post.mjs.map
