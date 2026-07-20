import { l as defineEventHandler, p as requireUser, u as useRuntimeConfig, x as getStripe, y as setStripeCustomerId } from '../../../nitro/nitro.mjs';
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

const portal_post = defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const config = useRuntimeConfig();
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
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/pricing`
  });
  return { url: portal.url };
});

export { portal_post as default };
//# sourceMappingURL=portal.post.mjs.map
