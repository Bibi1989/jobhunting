import type { Job } from '../../shared/types/job'

const FALLBACK_MODELS = [
  'gemini-3.1-pro-preview',
] as const

export function getGeminiModels(primary: string): string[] {
  return [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)]
}

export function normalizeJobs(raw: unknown, sourceUrl: string): Job[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      title: String(item.title || '').trim(),
      company: item.company ? String(item.company).trim() : undefined,
      location: String(item.location || 'Unknown').trim(),
      salaryMin: typeof item.salaryMin === 'number' ? item.salaryMin : undefined,
      salaryMax: typeof item.salaryMax === 'number' ? item.salaryMax : undefined,
      currency: item.currency ? String(item.currency).trim() : undefined,
      url: resolveJobUrl(String(item.url || '').trim(), sourceUrl),
      description: item.description ? String(item.description).trim() : undefined,
      descriptionSource: item.description ? 'listing' : undefined,
    }))
    .filter((job) => job.title && job.url)
}

function resolveJobUrl(url: string, sourceUrl: string): string {
  if (!url) return sourceUrl
  if (url.startsWith('http')) return url
  try {
    return new URL(url, sourceUrl).href
  } catch {
    return sourceUrl
  }
}

export function formatGeminiError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Gemini request failed. Please try again.'
  }

  const err = error as {
    message?: string
    status?: number | string
    error?: { message?: string; code?: number; status?: string }
  }

  const nested = err.error?.message
  if (nested) {
    if (err.error?.code === 503 || err.error?.status === 'UNAVAILABLE') {
      return 'Gemini is temporarily overloaded. Wait a moment and try again.'
    }
    return nested
  }

  if (err.message) {
    try {
      const parsed = JSON.parse(err.message) as { error?: { message?: string } }
      if (parsed.error?.message) return parsed.error.message
    } catch {
      return err.message
    }
    return err.message
  }

  return 'Gemini request failed. Please try again.'
}
