/**
 * Unified CV layout schema — shared by the vue-pdf preview canvas and the
 * Nitro @react-pdf/renderer download pipeline so order + template never drift.
 */

import type { BuilderCustomSection, BuilderResumeData } from '~/shared/types/builder'

export type ResumeSectionId =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'achievements'
  | `custom:${string}`

/** Layout variety used by both render engines. */
export type PdfLayoutVariety = 'minimal' | 'modern' | 'tech'

export const DEFAULT_SECTIONS_ORDER: ResumeSectionId[] = [
  'summary',
  'experience',
  'projects',
  'education',
  'skills',
  'achievements',
]

export const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  achievements: 'Achievements',
}

export function customSectionKey(id: string): ResumeSectionId {
  return `custom:${id}`
}

export function isCustomSectionId(id: string): id is `custom:${string}` {
  return id.startsWith('custom:')
}

export function parseCustomSectionId(id: string): string | null {
  if (!isCustomSectionId(id)) return null
  return id.slice('custom:'.length)
}

export function sectionLabel(id: ResumeSectionId, customSections: BuilderCustomSection[] = []): string {
  if (isCustomSectionId(id)) {
    const customId = parseCustomSectionId(id)
    const found = customSections.find((s) => s.id === customId)
    return found?.title || 'Custom'
  }
  return SECTION_LABELS[id] || id
}

/** Resolve the active template identity (prefer templateSlug, fall back to templateId). */
export function resolveTemplateSlug(data: Pick<BuilderResumeData, 'templateId' | 'templateSlug'>): string {
  return String(data.templateSlug || data.templateId || 'the-distinguished').trim() || 'the-distinguished'
}

/**
 * Map template slug → layout variety.
 * Prefer exact profiles from templates.ts (aligned with ResumeThemeRenderer).
 */
export function layoutVariety(templateSlug?: string): PdfLayoutVariety {
  // Lazy import avoided — profiles live in templates.ts; duplicate thin map here
  // via getPdfTemplateProfile would create a cycle, so keep a sync map.
  const id = (templateSlug || '').toLowerCase()
  const exact: Record<string, PdfLayoutVariety> = {
    'the-distinguished': 'modern',
    'the-corporate': 'minimal',
    'the-executive': 'modern',
    'the-partner': 'minimal',
    'the-innovator': 'tech',
    'the-digital-nomad': 'tech',
    'the-social-media-pro': 'modern',
    'the-creative-director': 'tech',
    'the-brand-architect': 'minimal',
    'the-typographer': 'modern',
    'the-strategist': 'tech',
    'the-engineer': 'tech',
    'the-researcher': 'minimal',
    'the-researcher-updated': 'minimal',
  }
  if (exact[id]) return exact[id]!

  if (
    id.includes('creative-director') ||
    id.includes('engineer') ||
    id.includes('strategist') ||
    id.includes('digital-nomad') ||
    id.includes('innovator')
  ) {
    return 'tech'
  }
  if (
    id.includes('executive') ||
    id.includes('corporate') ||
    id.includes('social-media') ||
    id.includes('distinguished') ||
    id.includes('typographer')
  ) {
    return id.includes('corporate') ? 'minimal' : 'modern'
  }
  return 'minimal'
}

/** @deprecated alias — prefer layoutVariety */
export function layoutFamily(templateId?: string): 'sidebar' | 'classic' | 'split' {
  const variety = layoutVariety(templateId)
  if (variety === 'tech') return 'sidebar'
  if (variety === 'modern') return 'split'
  return 'classic'
}

/**
 * Normalize a stored/partial sectionsOrder into a complete, deduped list that
 * includes every known content block (and current custom sections).
 */
export function normalizeSectionsOrder(
  order: string[] | undefined | null,
  customSections: BuilderCustomSection[] = [],
): ResumeSectionId[] {
  const customKeys = customSections.map((s) => customSectionKey(s.id))
  const allowed = new Set<string>([...DEFAULT_SECTIONS_ORDER, ...customKeys])
  const seen = new Set<string>()
  const result: ResumeSectionId[] = []

  for (const raw of order || []) {
    const id = String(raw || '').trim()
    if (!id || !allowed.has(id) || seen.has(id)) continue
    seen.add(id)
    result.push(id as ResumeSectionId)
  }

  for (const id of DEFAULT_SECTIONS_ORDER) {
    if (!seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }
  for (const id of customKeys) {
    if (!seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }

  return result
}

export function moveSection(
  order: ResumeSectionId[],
  index: number,
  direction: -1 | 1,
): ResumeSectionId[] {
  const next = [...order]
  const target = index + direction
  if (index < 0 || target < 0 || index >= next.length || target >= next.length) return next
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  return next
}

/** Ensure resume carries templateSlug + a normalized sectionsOrder. */
export function withLayoutState(data: BuilderResumeData): BuilderResumeData {
  const templateSlug = resolveTemplateSlug(data)
  return {
    ...data,
    templateId: data.templateId || templateSlug,
    templateSlug,
    sectionsOrder: normalizeSectionsOrder(data.sectionsOrder, data.customSections || []),
  }
}
