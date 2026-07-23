import type Stripe from 'stripe'
import { requireUser } from '~/server/utils/auth'
import { setStripeCustomerId } from '~/server/utils/db'
import {
  getStripe,
  getStripePublishableKey,
  isBillingInterval,
  resolveProCheckoutLineItem,
  type BillingInterval,
} from '~/server/utils/stripe'

/**
 * Create an Embedded Checkout session (custom JobFlow UI) in EUR.
 * Card is saved on the Stripe Customer for renewals / future payments.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const config = useRuntimeConfig()
  const body = await readBody<{ interval?: string; uiMode?: 'embedded' | 'hosted' }>(event)

  const interval: BillingInterval = isBillingInterval(body?.interval) ? body.interval : 'month'
  const uiMode = body?.uiMode === 'hosted' ? 'hosted' : 'embedded'
  const lineItem = resolveProCheckoutLineItem(interval)

  const publishableKey = getStripePublishableKey()
  if (uiMode === 'embedded' && !publishableKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Stripe publishable key missing. Set NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for embedded checkout.',
    })
  }

  const stripe = getStripe()
  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await setStripeCustomerId(user.id, customerId)
  }

  const appUrl = String(
    config.appUrl || process.env.NUXT_APP_URL || process.env.APP_URL || 'http://localhost:3000',
  ).replace(/\/$/, '')

  const baseParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [lineItem],
    metadata: { userId: user.id, billingInterval: interval },
    subscription_data: {
      metadata: { userId: user.id, billingInterval: interval },
    },
    payment_method_collection: 'always',
    saved_payment_method_options: {
      payment_method_save: 'enabled',
      allow_redisplay_filters: ['always'],
    },
    billing_address_collection: 'auto',
    locale: 'auto',
  }

  if (uiMode === 'embedded') {
    const session = await stripe.checkout.sessions.create({
      ...baseParams,
      ui_mode: 'embedded_page',
      return_url: `${appUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    } as Stripe.Checkout.SessionCreateParams)
    if (!session.client_secret) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create Checkout session' })
    }
    return {
      mode: 'embedded' as const,
      clientSecret: session.client_secret,
      publishableKey,
      sessionId: session.id,
      interval,
    }
  }

  const session = await stripe.checkout.sessions.create({
    ...baseParams,
    success_url: `${appUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
  })

  if (!session.url) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create Checkout session' })
  }

  return {
    mode: 'hosted' as const,
    url: session.url,
    sessionId: session.id,
    interval,
  }
})
