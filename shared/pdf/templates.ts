/**
 * Per-template PDF profile — mirrors ResumeThemeRenderer structure so the
 * selected gallery template drives a matching PDF layout family + theme.
 */

import type { PdfLayoutVariety } from './schema'

export type PdfHeaderChrome = 'plain' | 'centered' | 'band' | 'rules' | 'banner' | 'accent-bar'
export type PdfSkillsStyle = 'chips' | 'list' | 'inline'

export type PdfTemplateTheme = {
  brand: string
  ink: string
  muted: string
  sidebar: string
  sidebarText: string
  sidebarMuted: string
  paper: string
  accent: string
  dark?: boolean
}

export type PdfTemplateProfile = {
  slug: string
  variety: PdfLayoutVariety
  /** tech: left | right sidebar; modern: classic split */
  sidebarSide?: 'left' | 'right'
  headerChrome?: PdfHeaderChrome
  skillsStyle?: PdfSkillsStyle
  /** Larger editorial name (Typographer). */
  displayName?: boolean
  theme: PdfTemplateTheme
}

const DEFAULT_THEME: PdfTemplateTheme = {
  brand: '#006a61',
  ink: '#0f172a',
  muted: '#475569',
  sidebar: '#006a61',
  sidebarText: '#ffffff',
  sidebarMuted: '#ccfbf1',
  paper: '#ffffff',
  accent: '#006a61',
}

/** Exact slug → layout profile (aligned with ResumeThemeRenderer). */
const PROFILES: Record<string, PdfTemplateProfile> = {
  // —— Professional single-column family (differentiated chrome) ——
  'the-corporate': {
    slug: 'the-corporate',
    variety: 'minimal',
    headerChrome: 'band',
    skillsStyle: 'chips',
    theme: { ...DEFAULT_THEME, brand: '#0f172a', accent: '#0f172a', ink: '#0f172a' },
  },
  'the-partner': {
    slug: 'the-partner',
    variety: 'minimal',
    headerChrome: 'rules',
    skillsStyle: 'chips',
    theme: { ...DEFAULT_THEME, brand: '#1c1917', accent: '#1c1917', ink: '#1c1917' },
  },
  'the-researcher': {
    slug: 'the-researcher',
    variety: 'minimal',
    headerChrome: 'plain',
    skillsStyle: 'inline',
    theme: { ...DEFAULT_THEME, brand: '#1e3a5f', accent: '#1e3a5f' },
  },

  // —— Split / editorial family (differentiated chrome) ——
  'the-distinguished': {
    slug: 'the-distinguished',
    variety: 'modern',
    headerChrome: 'accent-bar',
    skillsStyle: 'list',
    theme: { ...DEFAULT_THEME, brand: '#1e3a5f', accent: '#1e3a5f' },
  },
  'the-executive': {
    slug: 'the-executive',
    variety: 'modern',
    headerChrome: 'centered',
    skillsStyle: 'list',
    theme: { ...DEFAULT_THEME, brand: '#0f172a', accent: '#0f172a' },
  },
  'the-social-media-pro': {
    slug: 'the-social-media-pro',
    variety: 'modern',
    headerChrome: 'banner',
    skillsStyle: 'chips',
    theme: { ...DEFAULT_THEME, brand: '#0f172a', accent: '#0f172a' },
  },
  'the-typographer': {
    slug: 'the-typographer',
    variety: 'minimal',
    headerChrome: 'plain',
    skillsStyle: 'inline',
    displayName: true,
    theme: { ...DEFAULT_THEME, brand: '#111827', accent: '#111827', ink: '#111827' },
  },

  // —— Tech / creative sidebars (already distinct) ——
  'the-innovator': {
    slug: 'the-innovator',
    variety: 'tech',
    sidebarSide: 'right',
    skillsStyle: 'chips',
    theme: {
      ...DEFAULT_THEME,
      dark: true,
      brand: '#22d3ee',
      ink: '#e2e8f0',
      muted: '#94a3b8',
      sidebar: '#020617',
      sidebarText: '#f8fafc',
      sidebarMuted: '#67e8f9',
      paper: '#0f172a',
      accent: '#22d3ee',
    },
  },
  'the-digital-nomad': {
    slug: 'the-digital-nomad',
    variety: 'tech',
    sidebarSide: 'left',
    skillsStyle: 'chips',
    theme: {
      ...DEFAULT_THEME,
      brand: '#0f172a',
      sidebar: '#0f172a',
      sidebarText: '#f8fafc',
      sidebarMuted: '#94a3b8',
      accent: '#38bdf8',
    },
  },
  'the-creative-director': {
    slug: 'the-creative-director',
    variety: 'tech',
    sidebarSide: 'left',
    skillsStyle: 'chips',
    theme: {
      ...DEFAULT_THEME,
      brand: '#0f766e',
      sidebar: '#0f766e',
      sidebarText: '#ffffff',
      sidebarMuted: '#99f6e4',
      accent: '#14b8a6',
    },
  },
  'the-strategist': {
    slug: 'the-strategist',
    variety: 'tech',
    sidebarSide: 'left',
    skillsStyle: 'chips',
    theme: {
      ...DEFAULT_THEME,
      brand: '#334155',
      sidebar: '#f1f5f9',
      sidebarText: '#0f172a',
      sidebarMuted: '#64748b',
      accent: '#0f172a',
    },
  },
  'the-engineer': {
    slug: 'the-engineer',
    variety: 'tech',
    sidebarSide: 'right',
    skillsStyle: 'chips',
    theme: {
      ...DEFAULT_THEME,
      brand: '#0369a1',
      sidebar: '#e0f2fe',
      sidebarText: '#0c4a6e',
      sidebarMuted: '#0369a1',
      accent: '#0284c7',
    },
  },
}

/** Near-duplicates folded into a canonical profile (legacy IDs still resolve). */
const ALIASES: Record<string, string> = {
  'the-brand-architect': 'the-partner',
  'the-researcher-updated': 'the-researcher',
}

export function getPdfTemplateProfile(templateSlug?: string | null): PdfTemplateProfile {
  const raw = String(templateSlug || 'the-distinguished').trim() || 'the-distinguished'
  const slug = ALIASES[raw] || raw
  if (PROFILES[slug]) return { ...PROFILES[slug]!, slug }

  // Legacy / fuzzy fallback keyed like ResumeThemeRenderer
  const id = slug.toLowerCase()
  if (id.includes('creative-director')) return { ...PROFILES['the-creative-director']!, slug }
  if (id.includes('digital-nomad')) return { ...PROFILES['the-digital-nomad']!, slug }
  if (id.includes('strategist')) return { ...PROFILES['the-strategist']!, slug }
  if (id.includes('innovator')) return { ...PROFILES['the-innovator']!, slug }
  if (id.includes('engineer')) return { ...PROFILES['the-engineer']!, slug }
  if (id.includes('social-media')) return { ...PROFILES['the-social-media-pro']!, slug }
  if (id.includes('typographer')) return { ...PROFILES['the-typographer']!, slug }
  if (id.includes('executive')) return { ...PROFILES['the-executive']!, slug }
  if (id.includes('partner') || id.includes('brand')) return { ...PROFILES['the-partner']!, slug }
  if (id.includes('researcher')) return { ...PROFILES['the-researcher']!, slug }
  if (id.includes('corporate')) return { ...PROFILES['the-corporate']!, slug }
  if (id.includes('distinguished')) return { ...PROFILES['the-distinguished']!, slug }
  return { ...PROFILES['the-distinguished']!, slug }
}
