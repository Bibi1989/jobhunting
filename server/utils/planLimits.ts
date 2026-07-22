import type { AppUser } from '~/server/utils/db'
import { query } from '~/server/utils/db'
import { DEFAULT_TEMPLATE_SLUG } from '~/shared/types/portfolio'

export type BuilderDocKind = 'resume' | 'cover_letter'

function isUnlimited(user: Pick<AppUser, 'planTier' | 'role'>) {
  return user.role === 'admin' || user.planTier === 'pro'
}

export async function countBuilderDocuments(
  userId: string,
  kind: BuilderDocKind,
): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM user_documents
     WHERE user_id = $1
       AND mime_type = 'application/json'
       AND doc_type = $2`,
    [userId, kind],
  )
  return Number(result.rows[0]?.count || 0)
}

export async function assertFreeBuilderQuota(
  user: Pick<AppUser, 'id' | 'planTier' | 'role'>,
  kind: BuilderDocKind,
) {
  if (isUnlimited(user)) return

  const count = await countBuilderDocuments(user.id, kind)
  if (count >= 1) {
    const label = kind === 'cover_letter' ? 'cover letter' : 'resume'
    throw createError({
      statusCode: 403,
      statusMessage: `Free plan allows 1 ${label}. Upgrade to Pro for unlimited projects.`,
    })
  }
}

export async function countPortfolios(userId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM portfolios WHERE user_id = $1`,
    [userId],
  )
  return Number(result.rows[0]?.count || 0)
}

export async function assertFreePortfolioQuota(
  user: Pick<AppUser, 'id' | 'planTier' | 'role'>,
) {
  if (isUnlimited(user)) return

  const count = await countPortfolios(user.id)
  if (count >= 1) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Free plan allows 1 portfolio. Upgrade to Pro for unlimited portfolios.',
    })
  }
}

/** Free users may only use the first portfolio template. */
export function resolvePortfolioTemplateForPlan(
  user: Pick<AppUser, 'planTier' | 'role'>,
  requestedSlug: string,
): string {
  if (isUnlimited(user)) return requestedSlug
  return DEFAULT_TEMPLATE_SLUG
}
