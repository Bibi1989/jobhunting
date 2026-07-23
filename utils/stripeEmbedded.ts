import type { Stripe, StripeEmbeddedCheckout } from '@stripe/stripe-js'

/** Stripe Dahlia API: createEmbeddedCheckoutPage (falls back to legacy initEmbeddedCheckout). */
export async function createEmbeddedCheckout(
  stripe: Stripe,
  opts: { clientSecret: string },
): Promise<StripeEmbeddedCheckout> {
  const s = stripe as unknown as {
    createEmbeddedCheckoutPage?: (o: { clientSecret: string }) => Promise<StripeEmbeddedCheckout>
    initEmbeddedCheckout?: (o: { clientSecret: string }) => Promise<StripeEmbeddedCheckout>
  }
  if (typeof s.createEmbeddedCheckoutPage === 'function') {
    return s.createEmbeddedCheckoutPage(opts)
  }
  if (typeof s.initEmbeddedCheckout === 'function') {
    return s.initEmbeddedCheckout(opts)
  }
  throw new Error('Stripe.js does not support Embedded Checkout on this version')
}
