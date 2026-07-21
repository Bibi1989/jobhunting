import type { GoogleGenAI } from '@google/genai'
import { Type } from '@google/genai'
import type { Job } from '../../shared/types/job'
import { ollamaJsonPrompt } from './aiFallback'
import { generateWithModels } from './gemini'
import { formatGeminiError, getGeminiModels } from './jobs'
import { cleanHtmlForExtraction, fetchPageHtml } from './scraper'

const DESCRIPTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description:
        'The complete job description copied from the page: responsibilities, requirements, benefits, and other posted details. Preserve structure with newlines.',
    },
    title: { type: Type.STRING },
    location: { type: Type.STRING },
    company: { type: Type.STRING },
    salaryMin: { type: Type.NUMBER },
    salaryMax: { type: Type.NUMBER },
    currency: { type: Type.STRING },
  },
  required: ['description'],
} as const

const MAX_DETAIL_PAGES = Number(process.env.SCRAPE_MAX_DETAIL_PAGES || 40)
const CONCURRENCY = Number(process.env.SCRAPE_DETAIL_CONCURRENCY || 4)

function urlsMatch(a: string, b: string): boolean {
  try {
    const left = new URL(a)
    const right = new URL(b)
    const norm = (u: URL) =>
      `${u.origin}${u.pathname.replace(/\/+$/, '') || '/'}`.toLowerCase()
    return norm(left) === norm(right)
  } catch {
    return a.replace(/\/+$/, '').toLowerCase() === b.replace(/\/+$/, '').toLowerCase()
  }
}

export async function enrichJobsWithFullDescriptions(
  ai: GoogleGenAI,
  models: string[],
  jobs: Job[],
  listingUrl: string,
): Promise<Job[]> {
  const limit = Number.isFinite(MAX_DETAIL_PAGES) && MAX_DETAIL_PAGES > 0 ? MAX_DETAIL_PAGES : jobs.length
  const targets = jobs.slice(0, limit)
  const enriched: Job[] = []
  const concurrency = Math.max(1, Number.isFinite(CONCURRENCY) ? CONCURRENCY : 4)

  for (let i = 0; i < targets.length; i += concurrency) {
    const batch = targets.slice(i, i + concurrency)
    const results = await Promise.all(
      batch.map((job) => enrichSingleJob(ai, models, job, listingUrl)),
    )
    enriched.push(...results)
  }

  if (jobs.length > targets.length) {
    enriched.push(
      ...jobs.slice(targets.length).map((job) => ({
        ...job,
        descriptionSource: job.description ? 'listing' : undefined,
      })),
    )
  }

  return enriched
}

async function enrichSingleJob(
  ai: GoogleGenAI,
  models: string[],
  job: Job,
  listingUrl: string,
): Promise<Job & { descriptionSource?: string }> {
  if (!job.url || urlsMatch(job.url, listingUrl)) {
    return {
      ...job,
      descriptionSource: job.description ? 'listing' : undefined,
    }
  }

  try {
    const { html, isError, status, finalUrl } = await fetchPageHtml(job.url)
    if (isError || status >= 400 || !html) {
      return {
        ...job,
        descriptionSource: job.description ? 'listing' : undefined,
      }
    }

    // Some boards redirect detail links back to the listing — keep listing text.
    if (urlsMatch(finalUrl, listingUrl)) {
      return {
        ...job,
        descriptionSource: job.description ? 'listing' : undefined,
      }
    }

    const cleaned = cleanHtmlForExtraction(html, finalUrl || job.url)
    if (cleaned.length < 200) {
      return {
        ...job,
        descriptionSource: job.description ? 'listing' : undefined,
      }
    }

    const details = await extractFullDescription(ai, models, cleaned, job)
    const detailDescription = details.description?.trim() || ''
    // Prefer the detail-page text whenever it is meaningfully longer than the listing blurb.
    const listingDescription = job.description?.trim() || ''
    const description =
      detailDescription.length >= Math.max(120, listingDescription.length * 0.6)
        ? detailDescription
        : detailDescription || listingDescription

    return {
      ...job,
      title: details.title?.trim() || job.title,
      company: details.company?.trim() || job.company,
      location: details.location?.trim() || job.location,
      salaryMin: details.salaryMin ?? job.salaryMin,
      salaryMax: details.salaryMax ?? job.salaryMax,
      currency: details.currency || job.currency,
      description: description || undefined,
      descriptionSource: detailDescription
        ? 'detail_page'
        : listingDescription
          ? 'listing'
          : undefined,
    }
  } catch (error) {
    console.warn(`Failed to enrich ${job.url}:`, formatGeminiError(error))
    return {
      ...job,
      descriptionSource: job.description ? 'listing' : undefined,
    }
  }
}

async function extractFullDescription(
  ai: GoogleGenAI,
  models: string[],
  html: string,
  job: Job,
) {
  const response = await generateWithModels(
    ai,
    models,
    (model) =>
      ai.models.generateContent({
        model,
        contents: `Extract the FULL job posting content from this HTML for the role "${job.title}".
Include the complete description as it appears on the careers page: about the role, responsibilities, qualifications/requirements, preferred skills, benefits, and any other posted sections.
Do not summarize. Preserve readable paragraph breaks.
If salary is present, include numeric salaryMin/salaryMax and currency.

HTML:
${html.slice(0, 90000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: DESCRIPTION_SCHEMA,
        },
      }),
    async () => {
      const parsed = await ollamaJsonPrompt<{
        description?: string
        title?: string
        location?: string
        company?: string
        salaryMin?: number
        salaryMax?: number
        currency?: string
      }>({
        system:
          'Extract the full job description from HTML. Return JSON with description, title, location, company, salaryMin, salaryMax, currency.',
        user: `Role: ${job.title}\n\nHTML:\n${html.slice(0, 50000)}`,
      })
      return { text: JSON.stringify(parsed) }
    },
  )

  return JSON.parse(response.text || '{}') as {
    description?: string
    title?: string
    location?: string
    company?: string
    salaryMin?: number
    salaryMax?: number
    currency?: string
  }
}

export function resolveEnrichmentModels(primary: string) {
  return getGeminiModels(primary)
}
