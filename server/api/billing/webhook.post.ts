import type Stripe from 'stripe'
import {
  FREE_CREDITS,
  PRO_CREDITS,
  addCredits,
  getUserById,
  getUserByStripeCustomerId,
  setPlanAndCredits,
  setStripeSubscriptionId,
} from '~/server/utils/db'
import { getStripe, getStripeWebhookSecret } from '~/server/utils/stripe'

async function applyCreditTopupFromSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind !== 'credit_topup') return
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return

  const credits = Number(session.metadata.credits || 0)
  if (!Number.isFinite(credits) || credits <= 0) {
    console.warn('[stripe webhook] top-up session missing credits', session.id)
    return
  }

  let userId = session.metadata.userId || session.client_reference_id || null
  if (!userId) {
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id
    if (customerId) {
      const byCustomer = await getUserByStripeCustomerId(customerId)
      userId = byCustomer?.id || null
    }
  }
  if (!userId) {
    console.warn(`[stripe webhook] no user for top-up session ${session.id}`)
    return
  }

  const reason = `stripe_topup:${session.id}`
  await addCredits(userId, credits, reason)
}

async function applyCreditTopupFromPaymentIntent(pi: Stripe.PaymentIntent) {
  if (pi.metadata?.kind !== 'credit_topup') return
  if (pi.status !== 'succeeded') return

  const credits = Number(pi.metadata.credits || 0)
  if (!Number.isFinite(credits) || credits <= 0) {
    console.warn('[stripe webhook] top-up payment intent missing credits', pi.id)
    return
  }

  let userId = pi.metadata.userId || null
  if (!userId) {
    const customerId = typeof pi.customer === 'string' ? pi.customer : pi.customer?.id
    if (customerId) {
      const byCustomer = await getUserByStripeCustomerId(customerId)
      userId = byCustomer?.id || null
    }
  }
  if (!userId) {
    console.warn(`[stripe webhook] no user for top-up payment intent ${pi.id}`)
    return
  }

  await addCredits(userId, credits, `stripe_topup:${pi.id}`)
}

export default defineEventHandler(async (event) => {
  const webhookSecret = getStripeWebhookSecret()

  if (!webhookSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe webhook secret is not configured',
    })
  }

  const signature = getHeader(event, 'stripe-signature')
  if (!signature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature header' })
  }

  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Missing request body' })
  }

  const stripe = getStripe()
  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error('[stripe webhook] signature verification failed', error)
    throw createError({ statusCode: 400, statusMessage: 'Invalid Stripe signature' })
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        await applyCreditTopupFromSession(session)
        break
      }

      case 'payment_intent.succeeded': {
        const pi = stripeEvent.data.object as Stripe.PaymentIntent
        await applyCreditTopupFromPaymentIntent(pi)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (!customerId) break

        const user = await getUserByStripeCustomerId(customerId)
        if (!user) {
          console.warn(`[stripe webhook] no user for customer ${customerId}`)
          break
        }

        const invoiceAny = invoice as unknown as {
          subscription?: string | { id: string } | null
          parent?: { subscription_details?: { subscription?: string } }
        }
        const subscriptionId =
          typeof invoiceAny.subscription === 'string'
            ? invoiceAny.subscription
            : invoiceAny.subscription?.id ||
              invoiceAny.parent?.subscription_details?.subscription ||
              null

        await setPlanAndCredits(user.id, 'pro', PRO_CREDITS, 'stripe_invoice_payment_succeeded')
        if (subscriptionId) {
          await setStripeSubscriptionId(user.id, subscriptionId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id
        if (!customerId) break

        let user = await getUserByStripeCustomerId(customerId)
        if (!user && subscription.metadata?.userId) {
          user = await getUserById(subscription.metadata.userId)
        }
        if (!user) {
          console.warn(`[stripe webhook] no user for deleted subscription ${subscription.id}`)
          break
        }

        await setPlanAndCredits(user.id, 'free', FREE_CREDITS, 'stripe_subscription_deleted')
        await setStripeSubscriptionId(user.id, null)
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error('[stripe webhook] handler error', error)
    throw createError({ statusCode: 500, statusMessage: 'Webhook handler failed' })
  }

  return { received: true }
})
