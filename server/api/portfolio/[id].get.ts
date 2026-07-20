import { requireUser } from '~/server/utils/auth'
import { getPortfolioForUser } from '~/server/utils/portfolios'

/** GET /api/portfolio/:id — owner-scoped fetch of one portfolio (for editing). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid portfolio id' })
  }

  const portfolio = await getPortfolioForUser(id, user.id)
  if (!portfolio) {
    throw createError({ statusCode: 404, statusMessage: 'Portfolio not found' })
  }

  return { portfolio }
})
