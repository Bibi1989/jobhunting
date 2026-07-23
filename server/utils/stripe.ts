import Stripe from 'stripe'

let stripe: Stripe | null = null

/** Pro base price in euro cents (€5.99). */
export const PRO_EUR_CENTS_MONTHLY = 599

/** Longer cycles: 15% off (6 months), 25% off (yearly). */
export const PRO_SEMIANNUAL_DISCOUNT = 0.15
export const PRO_YEARLY_DISCOUNT = 0.25

export type BillingInterval = 'month' | 'semiannual' | 'year'

export const BILLING_INTERVALS: BillingInterval[] = ['month', 'semiannual', 'year']

export function isBillingInterval(v: unknown): v is BillingInterval {
  return v === 'month' || v === 'semiannual' || v === 'year'
}

/** Discounted Pro amounts for each billing cycle (EUR cents). */
export function proAmountForInterval(
  interval: BillingInterval,
  monthlyCents: number = PRO_EUR_CENTS_MONTHLY,
): {
  unitAmount: number
  fullAmount: number
  discountPercent: number
  stripeInterval: 'month' | 'year'
  intervalCount: number
} {
  const monthly = Math.max(50, Math.round(monthlyCents))
  switch (interval) {
    case 'semiannual': {
      const fullAmount = monthly * 6
      return {
        unitAmount: Math.round(fullAmount * (1 - PRO_SEMIANNUAL_DISCOUNT)),
        fullAmount,
        discountPercent: Math.round(PRO_SEMIANNUAL_DISCOUNT * 100),
        stripeInterval: 'month',
        intervalCount: 6,
      }
    }
    case 'year': {
      const fullAmount = monthly * 12
      return {
        unitAmount: Math.round(fullAmount * (1 - PRO_YEARLY_DISCOUNT)),
        fullAmount,
        discountPercent: Math.round(PRO_YEARLY_DISCOUNT * 100),
        stripeInterval: 'year',
        intervalCount: 1,
      }
    }
    default:
      return {
        unitAmount: monthly,
        fullAmount: monthly,
        discountPercent: 0,
        stripeInterval: 'month',
        intervalCount: 1,
      }
  }
}

export {
  CREDIT_TOPUP_PACKS,
  getCreditTopupPack,
  type CreditTopupPack,
  type CreditTopupPackId,
} from '~/shared/creditTopup'

export function resolveCreditTopupLineItem(
  pack: import('~/shared/creditTopup').CreditTopupPack,
): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    quantity: 1,
    price_data: {
      currency: 'eur',
      unit_amount: pack.eurCents,
      product_data: {
        name: `JobFlow credit top-up (${pack.credits})`,
        description: `${pack.credits} credits added to your Pro account immediately after payment.`,
      },
    },
  }
}

function envVal(...keys: string[]): string {
  for (const k of keys) {
    const v = process.env[k]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function envStripe(name: 'secret' | 'webhook' | 'priceMonth' | 'priceSemi' | 'priceYear' | 'publishable'): string {
  const config = useRuntimeConfig()
  if (name === 'secret') {
    return String(config.stripeSecretKey || envVal('NUXT_STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')).trim()
  }
  if (name === 'webhook') {
    return String(config.stripeWebhookSecret || envVal('NUXT_STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET')).trim()
  }
  if (name === 'priceMonth') {
    return String(config.stripePriceProMonthly || envVal('NUXT_STRIPE_PRICE_PRO_MONTHLY', 'STRIPE_PRICE_PRO_MONTHLY')).trim()
  }
  if (name === 'priceSemi') {
    return String(
      (config as { stripePriceProSemiannual?: string }).stripePriceProSemiannual ||
        envVal('NUXT_STRIPE_PRICE_PRO_SEMIANNUAL', 'STRIPE_PRICE_PRO_SEMIANNUAL'),
    ).trim()
  }
  if (name === 'priceYear') {
    return String(
      (config as { stripePriceProYearly?: string }).stripePriceProYearly ||
        envVal('NUXT_STRIPE_PRICE_PRO_YEARLY', 'STRIPE_PRICE_PRO_YEARLY'),
    ).trim()
  }
  return String(
    config.public?.stripePublishableKey ||
      envVal('NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY'),
  ).trim()
}

export function getStripeSecretKey(): string {
  return envStripe('secret')
}

export function getStripeWebhookSecret(): string {
  return envStripe('webhook')
}

export function getStripePublishableKey(): string {
  return envStripe('publishable')
}

export function getStripePriceProMonthly(): string {
  return envStripe('priceMonth')
}

function parseEuroAmountOrPriceId(raw: string): { kind: 'price'; id: string } | { kind: 'amount'; cents: number } | null {
  if (!raw) return null
  if (/^price_[a-zA-Z0-9]+$/.test(raw)) return { kind: 'price', id: raw }
  const normalized = raw.replace(/[€$£,\s]/g, '')
  if (/^\d+$/.test(normalized) && normalized.length >= 3 && !normalized.includes('.')) {
    // treat long integers as cents (e.g. 599)
    return { kind: 'amount', cents: Number(normalized) }
  }
  if (/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { kind: 'amount', cents: Math.round(Number(normalized) * 100) }
  }
  return null
}

function monthlyEuroCents(): number {
  const parsed = parseEuroAmountOrPriceId(envStripe('priceMonth'))
  if (parsed?.kind === 'amount' && parsed.cents >= 50) return parsed.cents
  return PRO_EUR_CENTS_MONTHLY
}

export type ProDisplayInterval = {
  unitAmountCents: number
  fullAmountCents: number
  equivMonthlyCents: number
  discountPercent: number
  intervalCount: number
}

export type ProDisplayPricing = {
  currency: 'eur'
  monthlyCents: number
  month: ProDisplayInterval
  semiannual: ProDisplayInterval
  year: ProDisplayInterval
}

/**
 * Public display amounts derived from STRIPE_PRICE_PRO_* env
 * (same resolution as Checkout). Prefer EUR amounts in env; Price ids fall
 * back to the discounted schedule from the monthly amount / default.
 */
export function getProDisplayPricing(): ProDisplayPricing {
  const monthly = monthlyEuroCents()

  const build = (interval: BillingInterval): ProDisplayInterval => {
    const schedule = proAmountForInterval(interval, monthly)
    const dedicatedRaw =
      interval === 'semiannual'
        ? envStripe('priceSemi')
        : interval === 'year'
          ? envStripe('priceYear')
          : envStripe('priceMonth')
    const dedicated = parseEuroAmountOrPriceId(dedicatedRaw)
    const unitAmount =
      dedicated?.kind === 'amount' && dedicated.cents >= 50
        ? dedicated.cents
        : schedule.unitAmount
    const months = schedule.intervalCount * (schedule.stripeInterval === 'year' ? 12 : 1)
    return {
      unitAmountCents: unitAmount,
      fullAmountCents: schedule.fullAmount,
      equivMonthlyCents: Math.round(unitAmount / Math.max(1, months)),
      discountPercent: schedule.discountPercent,
      intervalCount: schedule.intervalCount,
    }
  }

  return {
    currency: 'eur',
    monthlyCents: monthly,
    month: build('month'),
    semiannual: build('semiannual'),
    year: build('year'),
  }
}

/**
 * Build Checkout line item in EUR.
 * Prefers Dashboard Price ids when set; otherwise uses price_data with cycle discounts
 * (15% for 6 months, 25% for yearly).
 */
export function resolveProCheckoutLineItem(
  interval: BillingInterval = 'month',
): Stripe.Checkout.SessionCreateParams.LineItem {
  const dedicated =
    interval === 'semiannual'
      ? envStripe('priceSemi')
      : interval === 'year'
        ? envStripe('priceYear')
        : envStripe('priceMonth')

  const dedicatedParsed = parseEuroAmountOrPriceId(dedicated)
  if (dedicatedParsed?.kind === 'price') {
    return { price: dedicatedParsed.id, quantity: 1 }
  }

  const monthly = monthlyEuroCents()
  const schedule = proAmountForInterval(interval, monthly)

  let unitAmount = schedule.unitAmount
  // Explicit amount env for this interval overrides the discounted schedule.
  if (dedicatedParsed?.kind === 'amount') {
    unitAmount = dedicatedParsed.cents
  }

  if (!Number.isFinite(unitAmount) || unitAmount < 50) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Invalid Stripe Pro price. Set STRIPE_PRICE_PRO_MONTHLY to a Price id (price_…) or EUR amount like 5.99.',
    })
  }

  const discountNote =
    schedule.discountPercent > 0 ? ` Includes ${schedule.discountPercent}% multi-month discount.` : ''

  return {
    quantity: 1,
    price_data: {
      currency: 'eur',
      unit_amount: unitAmount,
      recurring: {
        interval: schedule.stripeInterval,
        interval_count: schedule.intervalCount,
      },
      product_data: {
        name: 'JobFlow Pro',
        description:
          `Unlimited resumes, cover letters, portfolios, scrape & AI. Credits refill each billing period.${discountNote}`,
      },
    },
  }
}

export function getStripe(): Stripe {
  if (stripe) return stripe

  const key = getStripeSecretKey()
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
