import { requireUser } from '~/server/utils/auth'
import { listPortfoliosByUser } from '~/server/utils/portfolios'

/** GET /api/portfolio — list the signed-in user's saved portfolios (newest first). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const portfolios = await listPortfoliosByUser(user.id)
  return { portfolios }
})
