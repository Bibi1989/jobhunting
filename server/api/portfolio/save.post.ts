import { requireUser } from '~/server/utils/auth'
import { createPortfolio, sanitizeProfileData } from '~/server/utils/portfolios'
import { isPortfolioTemplateSlug } from '~/shared/types/portfolio'
import {
  assertFreePortfolioQuota,
  resolvePortfolioTemplateForPlan,
} from '~/server/utils/planLimits'

/**
 * POST /api/portfolio/save
 *
 * Persists a generated portfolio (profileData + chosen templateSlug) against the
 * authenticated user's id. No credits are charged here — generation already did.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readBody<{ templateSlug?: string; profileData?: unknown }>(event)

  if (!isPortfolioTemplateSlug(body?.templateSlug)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid templateSlug is required' })
  }
  if (!body?.profileData || typeof body.profileData !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'profileData is missing or malformed' })
  }

  await assertFreePortfolioQuota(user)

  const templateSlug = resolvePortfolioTemplateForPlan(user, body.templateSlug!)

  const portfolio = await createPortfolio({
    userId: user.id,
    templateSlug,
    profileData: sanitizeProfileData(body.profileData),
  })

  return { portfolio }
})
