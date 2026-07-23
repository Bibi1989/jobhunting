import { setStripeCustomerId } from '~/server/utils/db'
import {
  getCreditTopupPack,
  getStripe,
  getStripePublishableKey,
} from '~/server/utils/stripe'
import { requireBillingUser } from '~/server/utils/billing'

type SavedCard = {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

/**
 * Create a PaymentIntent for a Pro credit top-up.
 * Client confirms with a saved Stripe card or a new card via Payment Element.
 */
export default defineEventHandler(async (event) => {
  const user = await requireBillingUser(event)
  const body = await readBody<{ packId?: string }>(event)
  const pack = getCreditTopupPack(body?.packId)

  if (!pack) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Choose a valid credit pack (pack50, pack100, or pack150).',
    })
  }

  if (user.planTier !== 'pro') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Credit top-ups are available on an active Pro plan. Upgrade first.',
    })
  }

  const publishableKey = getStripePublishableKey()
  if (!publishableKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Stripe publishable key missing. Set NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.',
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

  const customer = await stripe.customers.retrieve(customerId)
  const defaultPm =
    !('deleted' in customer) && customer.invoice_settings?.default_payment_method
      ? typeof customer.invoice_settings.default_payment_method === 'string'
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings.default_payment_method.id
      : null

  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
    limit: 10,
  })

  const paymentMethods: SavedCard[] = methods.data.map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand || 'card',
    last4: pm.card?.last4 || '????',
    expMonth: pm.card?.exp_month || 0,
    expYear: pm.card?.exp_year || 0,
    isDefault: pm.id === defaultPm,
  }))

  // Prefer default card first in the UI list.
  paymentMethods.sort((a, b) => Number(b.isDefault) - Number(a.isDefault))

  const metadata = {
    userId: user.id,
    kind: 'credit_topup',
    packId: pack.id,
    credits: String(pack.credits),
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: pack.eurCents,
    currency: 'eur',
    customer: customerId,
    description: `JobFlow credit top-up (${pack.credits} credits)`,
    metadata,
    // Save newly entered cards on the Stripe Customer for future top-ups / renewals.
    setup_future_usage: 'off_session',
    automatic_payment_methods: { enabled: true },
  })

  if (!paymentIntent.client_secret) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create payment' })
  }

  return {
    mode: 'payment_intent' as const,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    publishableKey,
    pack,
    paymentMethods,
    defaultPaymentMethodId: defaultPm,
  }
})
