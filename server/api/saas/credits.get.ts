import { requireUser } from '~/server/utils/auth'
import { toPublicUser } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return {
    user: toPublicUser(user),
    creditsRemaining: Number(user.creditsRemaining),
    planTier: user.planTier,
  }
})
