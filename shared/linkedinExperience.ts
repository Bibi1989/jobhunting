/**
 * Shared LinkedIn experience sync protocol (web ↔ JobFlow extension).
 * LinkedIn does not allow third-party profile writes; we stage data for
 * copy/PDF fallbacks or extension DOM pre-fill (user still clicks Save).
 */

import type { BuilderExperience } from './types/builder'
import { htmlToBulletText } from '~/utils/richText'

export const LINKEDIN_NEW_POSITION_URL =
  'https://www.linkedin.com/in/me/edit/forms/position/new/' as const

export const STAGE_LINKEDIN_EXPERIENCE = 'STAGE_LINKEDIN_EXPERIENCE' as const
export const STAGE_LINKEDIN_EXPERIENCE_ACK = 'STAGE_LINKEDIN_EXPERIENCE_ACK' as const

/** postMessage `source` from the JobFlow web app */
export const JOBFLOW_WEB_SOURCE = 'jobflow-web' as const
/** postMessage `source` from the extension content bridge */
export const JOBFLOW_EXTENSION_SOURCE = 'jobflow-extension' as const

export interface LinkedInDateParts {
  month: number
  year: number
}

export interface LinkedInExperiencePayload {
  title: string
  company: string
  location: string
  startDate: LinkedInDateParts | null
  endDate: LinkedInDateParts | null
  isCurrent: boolean
  description: string
}

export interface StageLinkedInExperienceMessage {
  source: typeof JOBFLOW_WEB_SOURCE
  type: typeof STAGE_LINKEDIN_EXPERIENCE
  data: LinkedInExperiencePayload
}

export interface StageLinkedInExperienceAck {
  source: typeof JOBFLOW_EXTENSION_SOURCE
  type: typeof STAGE_LINKEDIN_EXPERIENCE_ACK
  ok: boolean
  error?: string
}

/** Parse `YYYY-MM` / `YYYY-MM-DD` / loose date strings into month+year. */
export function parseLinkedInDateParts(raw?: string | null): LinkedInDateParts | null {
  const s = String(raw || '').trim()
  if (!s) return null

  const iso = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?/)
  if (iso) {
    const year = Number(iso[1])
    const month = Number(iso[2])
    if (year >= 1900 && month >= 1 && month <= 12) return { month, year }
  }

  const named = s.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})$/i)
  if (named) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const month = months.indexOf(named[1]!.slice(0, 3).toLowerCase()) + 1
    const year = Number(named[2])
    if (month >= 1 && year >= 1900) return { month, year }
  }

  const yearOnly = s.match(/^(\d{4})$/)
  if (yearOnly) return { month: 1, year: Number(yearOnly[1]) }

  return null
}

/** Format HTML or plain description as LinkedIn Highlights bullets (one • per line). */
export function formatLinkedInDescription(htmlOrText?: string | null): string {
  const plain = htmlToBulletText(htmlOrText)
  if (!plain) return ''
  return plain
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^[-*●▪◦·]\s+/, '')
        .replace(/^•\s*/, '')
        .trim(),
    )
    .filter(Boolean)
    .map((line) => `• ${line}`)
    .join('\n')
}

export function builderExperienceToLinkedInPayload(
  exp: Pick<
    BuilderExperience,
    'title' | 'company' | 'location' | 'startDate' | 'endDate' | 'isCurrent' | 'description'
  >,
): LinkedInExperiencePayload {
  const isCurrent = exp.isCurrent === true
  return {
    title: String(exp.title || '').trim(),
    company: String(exp.company || '').trim(),
    location: String(exp.location || '').trim(),
    startDate: parseLinkedInDateParts(exp.startDate),
    endDate: isCurrent ? null : parseLinkedInDateParts(exp.endDate),
    isCurrent,
    description: formatLinkedInDescription(exp.description),
  }
}

export function isStageLinkedInMessage(data: unknown): data is StageLinkedInExperienceMessage {
  if (!data || typeof data !== 'object') return false
  const msg = data as Record<string, unknown>
  return (
    msg.source === JOBFLOW_WEB_SOURCE &&
    msg.type === STAGE_LINKEDIN_EXPERIENCE &&
    !!msg.data &&
    typeof msg.data === 'object'
  )
}
