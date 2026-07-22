import { requireUser } from '~/server/utils/auth'
import { sanitizeProfileData, updatePortfolioForUser } from '~/server/utils/portfolios'
import { isPortfolioTemplateSlug } from '~/shared/types/portfolio'
import { resolvePortfolioTemplateForPlan } from '~/server/utils/planLimits'

/**
 * PUT /api/portfolio/:id — owner-scoped update of a saved portfolio's design
 * (templateSlug) and/or content (profileData). No credits are charged for edits.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid portfolio id' })
  }

  const body = await readBody<{ templateSlug?: string; profileData?: unknown }>(event)

  if (!isPortfolioTemplateSlug(body?.templateSlug)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid templateSlug is required' })
  }
  if (!body?.profileData || typeof body.profileData !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'profileData is required' })
  }

  const profileData = sanitizeProfileData(body.profileData)
  if (!profileData.full_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Full name cannot be empty' })
  }

  const templateSlug = resolvePortfolioTemplateForPlan(user, body.templateSlug!)

  const portfolio = await updatePortfolioForUser(id, user.id, {
    templateSlug,
    profileData,
  })
  if (!portfolio) {
    throw createError({ statusCode: 404, statusMessage: 'Portfolio not found' })
  }

  return { portfolio }
})
