import type Stripe from 'stripe'
import {
  FREE_CREDITS,
  PRO_CREDITS,
  getUserById,
  getUserByStripeCustomerId,
  setPlanAndCredits,
  setStripeSubscriptionId,
} from '~/server/utils/db'
import { getStripe } from '~/server/utils/stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const webhookSecret = config.stripeWebhookSecret

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
