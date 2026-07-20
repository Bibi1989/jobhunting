import { query } from '~/server/utils/db'
import type { Portfolio, PortfolioProfileData } from '~/shared/types/portfolio'

/**
 * GET /api/portfolio/public/:id
 *
 * Public, unauthenticated read of a single portfolio for hosting/sharing. This is
 * the endpoint a user's custom domain (or a shared link) renders from, so it
 * intentionally requires no session. Only presentation fields are returned.
 */
export default defineEventHandler(async (event): Promise<{ portfolio: Portfolio }> => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid portfolio id' })
  }

  const result = await query<{
    id: string
    user_id: string
    template_slug: string
    profile_data: PortfolioProfileData
    created_at: Date
  }>(`SELECT * FROM portfolios WHERE id = $1`, [id])

  const row = result.rows[0]
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Portfolio not found' })
  }

  return {
    portfolio: {
      id: row.id,
      userId: row.user_id,
      templateSlug: row.template_slug,
      profileData:
        typeof row.profile_data === 'string'
          ? (JSON.parse(row.profile_data) as PortfolioProfileData)
          : row.profile_data,
      createdAt:
        row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    },
  }
})
