import { loadBillingStatus, requireBillingUser } from '~/server/utils/billing'

export default defineEventHandler(async (event) => {
  const user = await requireBillingUser(event)
  return loadBillingStatus(user)
})
