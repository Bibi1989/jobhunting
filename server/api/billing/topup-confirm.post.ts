import { addCredits } from '~/server/utils/db'
import { getStripe } from '~/server/utils/stripe'
import { loadBillingStatus, requireBillingUser } from '~/server/utils/billing'

/**
 * Confirm a credit top-up PaymentIntent (or legacy Checkout session).
 * Idempotent via credit_ledger reason `stripe_topup:{id}`.
 */
export default defineEventHandler(async (event) => {
  const user = await requireBillingUser(event)
  const body = await readBody<{ paymentIntentId?: string; sessionId?: string }>(event)
  const paymentIntentId = body?.paymentIntentId?.trim() || ''
  const sessionId = body?.sessionId?.trim() || ''

  const stripe = getStripe()

  if (paymentIntentId.startsWith('pi_')) {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (pi.metadata?.kind !== 'credit_topup') {
      throw createError({ statusCode: 400, statusMessage: 'This payment is not a credit top-up' })
    }

    if (pi.metadata.userId && pi.metadata.userId !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'This top-up belongs to another account' })
    }

    const customerId = typeof pi.customer === 'string' ? pi.customer : pi.customer?.id
    if (user.stripeCustomerId && customerId && customerId !== user.stripeCustomerId) {
      throw createError({ statusCode: 403, statusMessage: 'This top-up belongs to another account' })
    }

    if (pi.status !== 'succeeded') {
      throw createError({
        statusCode: 402,
        statusMessage: `Payment is not complete yet (status: ${pi.status}).`,
      })
    }

    const credits = Number(pi.metadata.credits || 0)
    if (!Number.isFinite(credits) || credits <= 0) {
      throw createError({ statusCode: 500, statusMessage: 'Top-up payment is missing credit amount' })
    }

    // Attach used payment method as default if customer has none.
    const pmId = typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id
    if (pmId && user.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId)
        if (!('deleted' in customer) && !customer.invoice_settings?.default_payment_method) {
          await stripe.customers.update(user.stripeCustomerId, {
            invoice_settings: { default_payment_method: pmId },
          })
        }
      } catch {
        /* ignore */
      }
    }

    const updated = await addCredits(user.id, credits, `stripe_topup:${pi.id}`)
    if (!updated) {
      throw createError({ statusCode: 500, statusMessage: 'Could not apply credit top-up' })
    }

    return {
      ok: true,
      creditsAdded: credits,
      creditsRemaining: updated.creditsRemaining,
      status: await loadBillingStatus(updated),
    }
  }

  if (!sessionId.startsWith('cs_')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid payment_intent id (pi_…) or Checkout session id is required',
    })
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.metadata?.kind !== 'credit_topup') {
    throw createError({ statusCode: 400, statusMessage: 'This Checkout session is not a credit top-up' })
  }

  const sessionUserId = session.metadata.userId || session.client_reference_id
  if (sessionUserId && sessionUserId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'This top-up belongs to another account' })
  }

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id
  if (user.stripeCustomerId && customerId && customerId !== user.stripeCustomerId) {
    throw createError({ statusCode: 403, statusMessage: 'This top-up belongs to another account' })
  }

  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    throw createError({
      statusCode: 402,
      statusMessage: 'Payment is not complete yet. Try again in a moment.',
    })
  }

  const credits = Number(session.metadata.credits || 0)
  if (!Number.isFinite(credits) || credits <= 0) {
    throw createError({ statusCode: 500, statusMessage: 'Top-up session is missing credit amount' })
  }

  const updated = await addCredits(user.id, credits, `stripe_topup:${session.id}`)
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'Could not apply credit top-up' })
  }

  return {
    ok: true,
    creditsAdded: credits,
    creditsRemaining: updated.creditsRemaining,
    status: await loadBillingStatus(updated),
  }
})
