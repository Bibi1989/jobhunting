import { setStripeSubscriptionId } from '~/server/utils/db'
import { getStripe } from '~/server/utils/stripe'
import { loadBillingStatus, requireBillingUser } from '~/server/utils/billing'

const RESUMABLE = new Set(['active', 'trialing', 'past_due'])

/** Undo a scheduled cancel (keep Pro auto-renewing). */
export default defineEventHandler(async (event) => {
  const user = await requireBillingUser(event)

  if (!user.stripeSubscriptionId && !user.stripeCustomerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No Stripe subscription found for this account.',
    })
  }

  const stripe = getStripe()
  let subscriptionId = user.stripeSubscriptionId

  if (subscriptionId) {
    try {
      const existing = await stripe.subscriptions.retrieve(subscriptionId)
      if (!RESUMABLE.has(existing.status)) {
        subscriptionId = null
      }
    } catch {
      subscriptionId = null
    }
  }

  if (!subscriptionId && user.stripeCustomerId) {
    const list = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 10,
    })
    subscriptionId =
      list.data.find((s) => RESUMABLE.has(s.status) && s.cancel_at_period_end)?.id ||
      list.data.find((s) => RESUMABLE.has(s.status))?.id ||
      null
  }

  if (!subscriptionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No subscription to resume.',
    })
  }

  const updated = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })

  await setStripeSubscriptionId(user.id, updated.id)

  return {
    ok: true,
    cancelAtPeriodEnd: false,
    status: await loadBillingStatus({ ...user, stripeSubscriptionId: updated.id }),
  }
})
