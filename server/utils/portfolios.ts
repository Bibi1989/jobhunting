import { query } from './db'
import type {
  Portfolio,
  PortfolioCustomSection,
  PortfolioProfileData,
  PortfolioProject,
} from '~/shared/types/portfolio'

const optionalString = (v: unknown): string | undefined => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s ? s : undefined
}

/**
 * Coerce arbitrary (edited) input into a safe, fully-typed PortfolioProfileData.
 * Shared by the save and update routes so hand-edited payloads stay well-formed.
 */
export function sanitizeProfileData(input: unknown): PortfolioProfileData {
  const obj = (input ?? {}) as Record<string, unknown>

  const projects: PortfolioProject[] = Array.isArray(obj.formatted_projects)
    ? obj.formatted_projects.slice(0, 24).map((p) => {
        const project = (p ?? {}) as Record<string, unknown>
        return {
          title: String(project.title || '').slice(0, 200),
          description: String(project.description || '').slice(0, 2000),
          tech_stack: Array.isArray(project.tech_stack)
            ? project.tech_stack.map((t) => String(t).slice(0, 60)).filter(Boolean).slice(0, 30)
            : [],
          url: optionalString(project.url),
        }
      })
    : []

  const customSections: PortfolioCustomSection[] = Array.isArray(obj.custom_sections)
    ? obj.custom_sections.slice(0, 12).map((c, i) => {
        const cs = (c ?? {}) as Record<string, unknown>
        const id = optionalString(cs.id) || `custom-${i + 1}`
        return {
          id,
          title: String(cs.title || '').slice(0, 120),
          content: String(cs.content || '').slice(0, 4000),
        }
      })
    : []

  const sectionOrder = Array.isArray(obj.section_order)
    ? obj.section_order.map((s) => String(s)).filter(Boolean).slice(0, 40)
    : undefined

  const sectionTitles = obj.section_titles as Record<string, string> | undefined
  const buttonTexts = obj.button_texts as Record<string, string> | undefined

  return {
    full_name: String(obj.full_name || 'Candidate').slice(0, 160),
    professional_bio: String(obj.professional_bio || '').slice(0, 4000),
    formatted_projects: projects,
    core_skills: Array.isArray(obj.core_skills)
      ? obj.core_skills.map((s) => String(s).slice(0, 60)).filter(Boolean).slice(0, 40)
      : [],
    email: optionalString(obj.email),
    phone: optionalString(obj.phone),
    location: optionalString(obj.location),
    website: optionalString(obj.website) || (obj.website as any)?.url ? obj.website as any : undefined,
    linkedin: optionalString(obj.linkedin) || (obj.linkedin as any)?.url ? obj.linkedin as any : undefined,
    github: optionalString(obj.github) || (obj.github as any)?.url ? obj.github as any : undefined,
    resume: optionalString(obj.resume) || (obj.resume as any)?.url ? obj.resume as any : undefined,
    theme_color: optionalString(obj.theme_color),
    section_titles: sectionTitles ? {
      projects: optionalString(sectionTitles.projects),
      skills: optionalString(sectionTitles.skills),
      profile: optionalString(sectionTitles.profile),
    } : undefined,
    button_texts: buttonTexts ? {
      hero_cta: optionalString(buttonTexts.hero_cta),
      contact_cta: optionalString(buttonTexts.contact_cta),
      nav_projects: optionalString(buttonTexts.nav_projects),
      nav_skills: optionalString(buttonTexts.nav_skills),
      nav_contact: optionalString(buttonTexts.nav_contact),
    } : undefined,
    ...(customSections.length ? { custom_sections: customSections } : {}),
    ...(sectionOrder ? { section_order: sectionOrder } : {}),
  }
}

type PortfolioRow = {
  id: string
  user_id: string
  template_slug: string
  profile_data: PortfolioProfileData
  created_at: Date
}

function mapPortfolio(row: PortfolioRow): Portfolio {
  return {
    id: row.id,
    userId: row.user_id,
    templateSlug: row.template_slug,
    // pg returns JSONB already parsed; guard against string just in case.
    profileData:
      typeof row.profile_data === 'string'
        ? (JSON.parse(row.profile_data) as PortfolioProfileData)
        : row.profile_data,
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  }
}

export async function createPortfolio(input: {
  userId: string
  templateSlug: string
  profileData: PortfolioProfileData
}): Promise<Portfolio> {
  const result = await query<PortfolioRow>(
    `INSERT INTO portfolios (user_id, template_slug, profile_data)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.userId, input.templateSlug, JSON.stringify(input.profileData)],
  )
  return mapPortfolio(result.rows[0])
}

export async function listPortfoliosByUser(userId: string): Promise<Portfolio[]> {
  const result = await query<PortfolioRow>(
    `SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  )
  return result.rows.map(mapPortfolio)
}

/** Fetch a single portfolio, scoped to its owner (returns null if not theirs). */
export async function getPortfolioForUser(
  id: string,
  userId: string,
): Promise<Portfolio | null> {
  const result = await query<PortfolioRow>(
    `SELECT * FROM portfolios WHERE id = $1 AND user_id = $2`,
    [id, userId],
  )
  return result.rows[0] ? mapPortfolio(result.rows[0]) : null
}

/** Update a portfolio's template and/or profile data, scoped to its owner. */
export async function updatePortfolioForUser(
  id: string,
  userId: string,
  input: { templateSlug: string; profileData: PortfolioProfileData },
): Promise<Portfolio | null> {
  const result = await query<PortfolioRow>(
    `UPDATE portfolios
     SET template_slug = $3, profile_data = $4
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, input.templateSlug, JSON.stringify(input.profileData)],
  )
  return result.rows[0] ? mapPortfolio(result.rows[0]) : null
}

/** Delete a portfolio, scoped to its owner. Returns true if a row was removed. */
export async function deletePortfolioForUser(id: string, userId: string): Promise<boolean> {
  const result = await query(`DELETE FROM portfolios WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ])
  return (result.rowCount ?? 0) > 0
}
