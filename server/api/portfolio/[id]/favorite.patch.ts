import { requireUser } from '~/server/utils/auth'
import { setPortfolioFavoriteForUser } from '~/server/utils/portfolios'

/** PATCH /api/portfolio/:id/favorite — body: { isFavorite: boolean } */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Portfolio id is required' })
  }

  const body = await readBody<{ isFavorite?: boolean }>(event)
  const isFavorite = Boolean(body?.isFavorite)

  const portfolio = await setPortfolioFavoriteForUser(id, user.id, isFavorite)
  if (!portfolio) {
    throw createError({ statusCode: 404, statusMessage: 'Portfolio not found' })
  }

  return { id: portfolio.id, isFavorite: portfolio.isFavorite }
})
