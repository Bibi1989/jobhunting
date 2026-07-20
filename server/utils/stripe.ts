import Stripe from 'stripe'

let stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (stripe) return stripe

  const config = useRuntimeConfig()
  const key = config.stripeSecretKey
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe is not configured (STRIPE_SECRET_KEY missing)',
    })
  }

  stripe = new Stripe(key, {
    apiVersion: '2026-06-24.dahlia',
  })
  return stripe
}
