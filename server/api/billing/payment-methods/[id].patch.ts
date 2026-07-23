import { getStripe } from '~/server/utils/stripe'
import {
  loadBillingStatus,
  requireBillingUser,
  requireOwnedPaymentMethod,
} from '~/server/utils/billing'

/**
 * Update a saved card: set as default and/or change expiry month/year.
 */
export default defineEventHandler(async (event) => {
  const user = await requireBillingUser(event)
  const id = getRouterParam(event, 'id') || ''
  await requireOwnedPaymentMethod(user, id)

  const body = await readBody<{
    setDefault?: boolean
    expMonth?: number
    expYear?: number
  }>(event)

  const stripe = getStripe()

  const expMonth = body?.expMonth != null ? Number(body.expMonth) : undefined
  const expYear = body?.expYear != null ? Number(body.expYear) : undefined

  if (expMonth != null || expYear != null) {
    if (
      expMonth == null ||
      expYear == null ||
      !Number.isInteger(expMonth) ||
      !Number.isInteger(expYear) ||
      expMonth < 1 ||
      expMonth > 12 ||
      expYear < new Date().getFullYear() ||
      expYear > new Date().getFullYear() + 30
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Provide a valid card expiry month (1–12) and year.',
      })
    }
    await stripe.paymentMethods.update(id, {
      card: { exp_month: expMonth, exp_year: expYear },
    })
  }

  if (body?.setDefault && user.stripeCustomerId) {
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: id },
    })
  }

  return {
    ok: true,
    status: await loadBillingStatus(user),
  }
})
