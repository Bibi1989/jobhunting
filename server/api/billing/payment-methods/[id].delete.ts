import { getStripe } from '~/server/utils/stripe'
import {
  loadBillingStatus,
  requireBillingUser,
  requireOwnedPaymentMethod,
} from '~/server/utils/billing'

/** Detach (delete) a saved card from the customer's Stripe account. */
export default defineEventHandler(async (event) => {
  const user = await requireBillingUser(event)
  const id = getRouterParam(event, 'id') || ''
  await requireOwnedPaymentMethod(user, id)

  const stripe = getStripe()
  await stripe.paymentMethods.detach(id)

  // If this was the default, clear it (Stripe may leave a dangling id).
  if (user.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId)
      if (!('deleted' in customer)) {
        const defaultPm = customer.invoice_settings?.default_payment_method
        const defaultId =
          typeof defaultPm === 'string' ? defaultPm : defaultPm && 'id' in defaultPm ? defaultPm.id : null
        if (defaultId === id) {
          await stripe.customers.update(user.stripeCustomerId, {
            invoice_settings: { default_payment_method: undefined },
          })
        }
      }
    } catch {
      /* ignore */
    }
  }

  return {
    ok: true,
    status: await loadBillingStatus(user),
  }
})
