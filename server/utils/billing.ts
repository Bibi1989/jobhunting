import type Stripe from 'stripe'
import { requireUser } from '~/server/utils/auth'
import { getStripe, getStripeSecretKey } from '~/server/utils/stripe'

export type BillingInvoice = {
  id: string
  number: string | null
  status: string | null
  amountPaid: number
  currency: string
  created: number
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  description: string | null
  kind: 'invoice' | 'charge'
}

export type BillingPaymentMethod = {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

export type BillingStatus = {
  planTier: 'free' | 'pro'
  creditsRemaining: number
  email: string
  hasStripeCustomer: boolean
  hasSubscription: boolean
  subscription: {
    id: string
    status: string
    cancelAtPeriodEnd: boolean
    currentPeriodEnd: number | null
    cancelAt: number | null
    interval: string | null
    intervalCount: number | null
  } | null
  invoices: BillingInvoice[]
  paymentMethods: BillingPaymentMethod[]
  stripeConfigured: boolean
}

function periodEnd(sub: Stripe.Subscription): number | null {
  const raw = sub as Stripe.Subscription & { current_period_end?: number }
  return typeof raw.current_period_end === 'number' ? raw.current_period_end : null
}

function mapInvoice(inv: Stripe.Invoice): BillingInvoice {
  const desc =
    inv.description ||
    inv.lines?.data?.[0]?.description ||
    (inv.metadata?.kind === 'credit_topup' ? 'Credit top-up' : null)
  return {
    id: inv.id,
    number: inv.number,
    status: inv.status,
    amountPaid: inv.amount_paid,
    currency: inv.currency,
    created: inv.created,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    invoicePdf: inv.invoice_pdf ?? null,
    description: desc,
    kind: 'invoice',
  }
}

function mapCharge(charge: Stripe.Charge): BillingInvoice {
  return {
    id: charge.id,
    number: charge.receipt_number || charge.id.slice(0, 12),
    status: charge.status === 'succeeded' ? 'paid' : charge.status,
    amountPaid: charge.amount_captured || charge.amount,
    currency: charge.currency,
    created: charge.created,
    hostedInvoiceUrl: charge.receipt_url ?? null,
    invoicePdf: null,
    description:
      charge.description ||
      (charge.metadata?.kind === 'credit_topup'
        ? `Credit top-up${charge.metadata.credits ? ` (${charge.metadata.credits} credits)` : ''}`
        : 'Payment'),
    kind: 'charge',
  }
}

export async function loadBillingStatus(user: {
  email: string
  planTier: 'free' | 'pro'
  creditsRemaining: number
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}): Promise<BillingStatus> {
  const stripeConfigured = Boolean(getStripeSecretKey())
  const base: BillingStatus = {
    planTier: user.planTier,
    creditsRemaining: Number(user.creditsRemaining),
    email: user.email,
    hasStripeCustomer: Boolean(user.stripeCustomerId),
    hasSubscription: Boolean(user.stripeSubscriptionId),
    subscription: null,
    invoices: [],
    paymentMethods: [],
    stripeConfigured,
  }

  if (!stripeConfigured || !user.stripeCustomerId) {
    return base
  }

  const stripe = getStripe()
  const customerId = user.stripeCustomerId

  let subscription: Stripe.Subscription | null = null
  if (user.stripeSubscriptionId) {
    try {
      subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
    } catch (error) {
      console.warn('[billing] failed to retrieve subscription', error)
    }
  }

  if (!subscription) {
    try {
      const list = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 5,
      })
      subscription =
        list.data.find((s) => s.status === 'active' || s.status === 'trialing') ||
        list.data[0] ||
        null
    } catch (error) {
      console.warn('[billing] failed to list subscriptions', error)
    }
  }

  if (subscription) {
    const item = subscription.items?.data?.[0]
    base.hasSubscription = true
    base.subscription = {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      currentPeriodEnd: periodEnd(subscription),
      cancelAt: subscription.cancel_at ?? null,
      interval: item?.price?.recurring?.interval ?? null,
      intervalCount: item?.price?.recurring?.interval_count ?? null,
    }
  }

  const invoiceIds = new Set<string>()
  const linkedPaymentIds = new Set<string>()

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 24,
    })
    for (const inv of invoices.data) {
      invoiceIds.add(inv.id)
      const invAny = inv as unknown as {
        charge?: string | { id?: string } | null
        payment_intent?: string | { id?: string } | null
      }
      const chargeId =
        typeof invAny.charge === 'string' ? invAny.charge : invAny.charge?.id || null
      if (chargeId) linkedPaymentIds.add(chargeId)
      const piId =
        typeof invAny.payment_intent === 'string'
          ? invAny.payment_intent
          : invAny.payment_intent?.id || null
      if (piId) linkedPaymentIds.add(piId)
    }
    base.invoices = invoices.data.map(mapInvoice)
  } catch (error) {
    console.warn('[billing] failed to list invoices', error)
  }

  // Include one-time top-up charges that never produced an Invoice (older checkouts).
  try {
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 24,
    })
    for (const charge of charges.data) {
      if (!charge.paid && charge.status !== 'succeeded') continue
      if (linkedPaymentIds.has(charge.id)) continue
      const chargeAny = charge as unknown as {
        invoice?: string | { id?: string } | null
        payment_intent?: string | { id?: string } | null
      }
      if (chargeAny.invoice) {
        const invId =
          typeof chargeAny.invoice === 'string' ? chargeAny.invoice : chargeAny.invoice.id
        if (invId && invoiceIds.has(invId)) continue
      }
      const pi =
        typeof chargeAny.payment_intent === 'string'
          ? chargeAny.payment_intent
          : chargeAny.payment_intent?.id
      if (pi && linkedPaymentIds.has(pi)) continue
      base.invoices.push(mapCharge(charge))
    }
    base.invoices.sort((a, b) => b.created - a.created)
    base.invoices = base.invoices.slice(0, 24)
  } catch (error) {
    console.warn('[billing] failed to list charges', error)
  }

  try {
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
    base.paymentMethods = methods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand || 'card',
      last4: pm.card?.last4 || '????',
      expMonth: pm.card?.exp_month || 0,
      expYear: pm.card?.exp_year || 0,
      isDefault: pm.id === defaultPm,
    }))
  } catch (error) {
    console.warn('[billing] failed to list payment methods', error)
  }

  return base
}

export async function requireBillingUser(event: Parameters<typeof requireUser>[0]) {
  return requireUser(event)
}

/** Ensure a payment method belongs to the signed-in user's Stripe customer. */
export async function requireOwnedPaymentMethod(
  user: { stripeCustomerId: string | null },
  paymentMethodId: string,
): Promise<Stripe.PaymentMethod> {
  if (!user.stripeCustomerId) {
    throw createError({ statusCode: 400, statusMessage: 'No Stripe customer on this account.' })
  }
  if (!paymentMethodId || !paymentMethodId.startsWith('pm_')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payment method id.' })
  }

  const stripe = getStripe()
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
  const pmCustomer = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id
  if (pmCustomer !== user.stripeCustomerId) {
    throw createError({ statusCode: 403, statusMessage: 'This card does not belong to your account.' })
  }
  return pm
}
