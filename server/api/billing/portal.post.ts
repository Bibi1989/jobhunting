import { requireUser } from '~/server/utils/auth'
import { setStripeCustomerId } from '~/server/utils/db'
import { getStripe } from '~/server/utils/stripe'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const config = useRuntimeConfig()
  const stripe = getStripe()

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await setStripeCustomerId(user.id, customerId)
  }

  const appUrl = String(config.appUrl || 'http://localhost:3000').replace(/\/$/, '')
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/pricing`,
  })

  return { url: portal.url }
})
