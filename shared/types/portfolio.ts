/**
 * Shared portfolio types used by both the Nitro server and the Vue frontend.
 * `profileData` is the AI-parsed structure stored as JSONB in the `portfolios` table.
 */

export interface PortfolioProject {
  title: string
  description: string
  /** Technologies / tools used on the project. */
  tech_stack: string[]
  /** Optional live / case-study URL. */
  url?: string
}

/** A user-authored section (title + free text) appended to the portfolio body. */
export interface PortfolioCustomSection {
  /** Stable id, e.g. "custom-abc123". */
  id: string
  title: string
  content: string
}

export interface PortfolioLink {
  label: string
  url: string
}

/**
 * Structured portfolio payload returned by the AI generator and persisted as
 * `profile_data` (JSONB). Field names are snake_case to match the LLM contract.
 */
export interface PortfolioProfileData {
  full_name: string
  professional_bio: string
  formatted_projects: PortfolioProject[]
  core_skills: string[]
  email?: string
  phone?: string
  location?: string
  website?: string | PortfolioLink
  linkedin?: string | PortfolioLink
  github?: string | PortfolioLink
  resume?: string | PortfolioLink
  /** Custom overrides for default section headings. */
  section_titles?: {
    projects?: string
    skills?: string
    profile?: string
  }
  /** Selected color palette theme name (e.g. 'emerald', 'indigo') */
  theme_color?: string
  /** Custom texts for various buttons and navigation links. */
  button_texts?: {
    hero_cta?: string
    contact_cta?: string
    nav_projects?: string
    nav_skills?: string
    nav_contact?: string
  }
  /** Legacy: Custom call-to-action button text. Will be migrated to button_texts.contact_cta */
  cta_text?: string
  /** User-authored extra sections rendered in the portfolio body. */
  custom_sections?: PortfolioCustomSection[]
  /**
   * Ordered list of body-section keys: 'projects', 'skills', and any custom
   * section id. Controls the render order of the reorderable body region.
   */
  section_order?: string[]
}

export interface Portfolio {
  id: string
  userId: string
  templateSlug: string
  profileData: PortfolioProfileData
  createdAt: string
}

/** A selectable visual theme for the generated portfolio. */
export interface PortfolioTemplate {
  slug: string
  /** Persona name, e.g. "The Visionary". */
  name: string
  /** Short category tag, e.g. "Modern". */
  persona: string
  description: string
  /** Whether the template renders on a dark canvas (affects preview chrome). */
  dark: boolean
  /** Tailwind classes for the picker-card accent chip. */
  accentClass: string
}

/**
 * Catalog of the ten portfolio design themes. `slug` is the stable identifier
 * stored on the record; the rest is presentation metadata for the picker.
 * Each slug has a matching renderer under `components/portfolio/templates/`.
 */
export const PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  {
    slug: 'the-visionary',
    name: 'The Visionary',
    persona: 'Modern',
    description: 'Bright product-led hero with floating UI cards and a bold closing CTA.',
    dark: false,
    accentClass: 'bg-indigo-500',
  },
  {
    slug: 'the-minimalist',
    name: 'The Minimalist',
    persona: 'Mono',
    description: 'Stark dark canvas, oversized serif statements, and generous whitespace.',
    dark: true,
    accentClass: 'bg-slate-200',
  },
  {
    slug: 'the-architect',
    name: 'The Architect',
    persona: 'Tech',
    description: 'Dense engineering layout for distributed systems and infrastructure work.',
    dark: true,
    accentClass: 'bg-sky-500',
  },
  {
    slug: 'the-director',
    name: 'The Director',
    persona: 'Creative',
    description: 'Editorial magazine styling with serif headlines and a portrait feature.',
    dark: false,
    accentClass: 'bg-amber-500',
  },
  {
    slug: 'the-leader',
    name: 'The Leader',
    persona: 'Executive',
    description: 'Refined dark profile with a portrait medallion and gilded accents.',
    dark: true,
    accentClass: 'bg-yellow-500',
  },
  {
    slug: 'the-strategist',
    name: 'The Strategist',
    persona: 'Product',
    description: 'Metric-driven product narrative with clean KPI tiles and growth framing.',
    dark: true,
    accentClass: 'bg-teal-500',
  },
  {
    slug: 'the-creator',
    name: 'The Creator',
    persona: 'Digital',
    description: 'Vibrant, immersive gradients for motion, light, and interactive work.',
    dark: true,
    accentClass: 'bg-fuchsia-500',
  },
  {
    slug: 'the-investigator',
    name: 'The Investigator',
    persona: 'Research',
    description: 'Academic light theme with serif body and a publications-style project list.',
    dark: false,
    accentClass: 'bg-blue-800',
  },
  {
    slug: 'the-builder',
    name: 'The Builder',
    persona: 'Freelance',
    description: 'Precise engineering grid with monospace detailing and emerald accents.',
    dark: true,
    accentClass: 'bg-emerald-500',
  },
  {
    slug: 'the-catalyst',
    name: 'The Catalyst',
    persona: 'Marketing',
    description: 'Data-driven growth layout with CSS bar charts and a dominant CTA.',
    dark: false,
    accentClass: 'bg-green-500',
  },
]

export const DEFAULT_TEMPLATE_SLUG = PORTFOLIO_TEMPLATES[0]!.slug

export const PORTFOLIO_COLORS = [
  { id: 'emerald', hex: '#10b981', name: 'Emerald' },
  { id: 'indigo', hex: '#6366f1', name: 'Indigo' },
  { id: 'rose', hex: '#f43f5e', name: 'Rose' },
  { id: 'amber', hex: '#f59e0b', name: 'Amber' },
  { id: 'slate', hex: '#64748b', name: 'Slate' },
  { id: 'sky', hex: '#0ea5e9', name: 'Sky' },
  { id: 'fuchsia', hex: '#d946ef', name: 'Fuchsia' },
  { id: 'white', hex: '#ffffff', name: 'White' },
  { id: 'black', hex: '#000000', name: 'Black' },
] as const

export const DEFAULT_THEME_COLOR = PORTFOLIO_COLORS[0]!.id

export function isPortfolioTemplateSlug(slug: unknown): slug is string {
  return (
    typeof slug === 'string' && PORTFOLIO_TEMPLATES.some((template) => template.slug === slug)
  )
}

export function getPortfolioTemplate(slug: string): PortfolioTemplate {
  return PORTFOLIO_TEMPLATES.find((t) => t.slug === slug) ?? PORTFOLIO_TEMPLATES[0]!
}

/** Normalize optional URL / social fields into absolute https links. */
export function absoluteUrl(value?: string | null): string | null {
  const raw = (value || '').trim()
  if (!raw) return null
  if (/^(mailto:|tel:|https?:\/\/)/i.test(raw)) return raw
  if (raw.includes('@') && !raw.includes(' ')) return `mailto:${raw}`
  if (/^[\d\s+().-]{7,}$/.test(raw)) return `tel:${raw.replace(/[^\d+]/g, '')}`
  if (/linkedin\.com/i.test(raw) || raw.startsWith('in/')) {
    const path = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
    return `https://${path.startsWith('linkedin') ? path : `www.linkedin.com/${path}`}`
  }
  if (/github\.com/i.test(raw) || raw.startsWith('gh/')) {
    const path = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/^gh\//, '')
    return `https://${path.startsWith('github') ? path : `github.com/${path}`}`
  }
  return `https://${raw.replace(/^\/\//, '')}`
}

export type PortfolioSectionKind = 'projects' | 'skills' | 'custom'

export interface PortfolioBodySection {
  /** 'projects' | 'skills' | a custom section id. */
  key: string
  kind: PortfolioSectionKind
  /** Display heading for the section. */
  title: string
  /** Present when kind === 'custom'. */
  custom?: PortfolioCustomSection
}

/** Default body order when the profile has no explicit `section_order`. */
export const DEFAULT_SECTION_ORDER = ['projects', 'skills'] as const

/**
 * Resolve the ordered, renderable body sections for a profile. Shared by every
 * template so reordering + custom sections behave identically across designs.
 * - Honors `section_order`, drops keys with no content, appends any missing.
 * - `projectsTitle` / `skillsTitle` let a template use its own headings.
 */
export function orderedBodySections(
  data: PortfolioProfileData,
  titles: { projects?: string; skills?: string } = {},
): PortfolioBodySection[] {
  const customs = Array.isArray(data.custom_sections) ? data.custom_sections : []
  const customTitles = data.section_titles || {}

  const available = new Map<string, PortfolioBodySection>()
  if (data.formatted_projects?.length) {
    available.set('projects', {
      key: 'projects',
      kind: 'projects',
      title: customTitles.projects || titles.projects || 'Selected Work',
    })
  }
  if (data.core_skills?.length) {
    available.set('skills', { 
      key: 'skills', 
      kind: 'skills', 
      title: customTitles.skills || titles.skills || 'Skills' 
    })
  }
  for (const c of customs) {
    if (c.id && (c.title?.trim() || c.content?.trim())) {
      available.set(c.id, { key: c.id, kind: 'custom', title: c.title || 'Section', custom: c })
    }
  }

  const requested = Array.isArray(data.section_order) ? data.section_order : [...DEFAULT_SECTION_ORDER]
  const out: PortfolioBodySection[] = []
  const seen = new Set<string>()
  for (const key of requested) {
    const s = available.get(key)
    if (s && !seen.has(key)) {
      out.push(s)
      seen.add(key)
    }
  }
  // Append any available sections not named in section_order (defaults, new customs).
  for (const [key, s] of available) {
    if (!seen.has(key)) out.push(s)
  }
  return out
}

export function mailtoHref(email?: string | null): string | null {
  const value = (email || '').trim()
  if (!value || !value.includes('@')) return null
  return `mailto:${value}`
}

export function telHref(phone?: string | null): string | null {
  const value = (phone || '').trim()
  if (!value) return null
  return `tel:${value.replace(/[^\d+]/g, '')}`
}

/** Realistic sample used to render live template previews before generation. */
export const SAMPLE_PROFILE: PortfolioProfileData = {
  full_name: 'Jordan Avery',
  professional_bio:
    'Product-minded engineer and designer crafting digital experiences that bridge human needs and business goals. Ten years turning ambiguous problems into shipped, measurable products.',
  email: 'jordan.avery@example.com',
  phone: '+1 (415) 555-0142',
  location: 'San Francisco, CA',
  website: 'jordanavery.dev',
  linkedin: 'linkedin.com/in/jordanavery',
  github: 'github.com/jordanavery',
  formatted_projects: [
    {
      title: 'Atlas Analytics Platform',
      description:
        'Led design and build of a real-time analytics suite adopted by 40+ enterprise teams, cutting reporting time by 70 percent.',
      tech_stack: ['TypeScript', 'Nuxt', 'PostgreSQL', 'D3'],
      url: 'https://example.com/atlas',
    },
    {
      title: 'Nimbus Design System',
      description:
        'Created a cross-platform component library and token pipeline that unified five product surfaces.',
      tech_stack: ['Vue', 'Figma', 'Storybook'],
      url: 'https://example.com/nimbus',
    },
    {
      title: 'Signal Growth Engine',
      description:
        'Built an experimentation framework that lifted activation 18 percent across onboarding funnels.',
      tech_stack: ['Node', 'Redis', 'Python'],
      url: 'https://example.com/signal',
    },
  ],
  core_skills: [
    'Product Strategy',
    'Full-Stack Engineering',
    'UX Design',
    'Data Visualization',
    'Team Leadership',
    'Systems Architecture',
  ],
}
