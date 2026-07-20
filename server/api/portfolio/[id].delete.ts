import { requireUser } from '~/server/utils/auth'
import { deletePortfolioForUser } from '~/server/utils/portfolios'

/** DELETE /api/portfolio/:id — owner-scoped removal of a saved portfolio. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid portfolio id' })
  }

  const removed = await deletePortfolioForUser(id, user.id)
  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: 'Portfolio not found' })
  }

  return { removed: true }
})
