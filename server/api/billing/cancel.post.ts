import { setStripeSubscriptionId } from '~/server/utils/db'
import { getStripe } from '~/server/utils/stripe'
import { loadBillingStatus, requireBillingUser } from '~/server/utils/billing'

const CANCELABLE = new Set(['active', 'trialing', 'past_due'])

/**
 * Cancel Pro at period end (user keeps access until current_period_end).
 * Actual downgrade happens via customer.subscription.deleted webhook.
 */
export default defineEventHandler(async (event) => {
  const user = await requireBillingUser(event)

  if (!user.stripeCustomerId && !user.stripeSubscriptionId) {
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
      if (!CANCELABLE.has(existing.status)) {
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
      list.data.find((s) => CANCELABLE.has(s.status) && !s.cancel_at_period_end)?.id ||
      list.data.find((s) => CANCELABLE.has(s.status))?.id ||
      null
  }

  if (!subscriptionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No active subscription to cancel.',
    })
  }

  const updated = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  await setStripeSubscriptionId(user.id, updated.id)

  const periodEnd =
    typeof (updated as unknown as { current_period_end?: number }).current_period_end === 'number'
      ? (updated as unknown as { current_period_end: number }).current_period_end
      : null

  return {
    ok: true,
    cancelAtPeriodEnd: true,
    currentPeriodEnd: periodEnd,
    status: await loadBillingStatus({ ...user, stripeSubscriptionId: updated.id }),
  }
})
