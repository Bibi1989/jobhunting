import type { Job } from '~/shared/types/job'
import type { BuilderResumeData } from '~/shared/types/builder'

export type BuilderJobPrefill = {
  jobId: string
  job: Job
  description: string
  company: string
  title: string
  resumeText: string
  resumeName: string
}

export type ApplyBuilderPrefill = {
  description: string
  title?: string
  resumeFile?: File | null
  resumeName?: string
}

const APPLY_PREFILL_STORAGE_KEY = 'builder-apply-prefill'

/** In-memory + sessionStorage bridge from Document Generator → Resume builder. */
export function useApplyBuilderPrefill() {
  return useState<ApplyBuilderPrefill | null>('apply-builder-prefill', () => null)
}

export function guessTitleFromJobDescription(description: string): string {
  const lines = description
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
  for (const line of lines.slice(0, 8)) {
    if (/^(job\s*title|position|role)\s*[:\-]/i.test(line)) {
      return line.replace(/^(job\s*title|position|role)\s*[:\-]\s*/i, '').trim().slice(0, 120)
    }
    if (line.length >= 4 && line.length <= 80 && !/@/.test(line) && !/^http/i.test(line)) {
      // Prefer a short first heading-like line
      if (/^[A-Z0-9]/.test(line) && !/^(about|we are|company|responsibilities|requirements)\b/i.test(line)) {
        return line.slice(0, 120)
      }
    }
  }
  return ''
}

export function persistApplyPrefill(prefill: ApplyBuilderPrefill) {
  const state = useApplyBuilderPrefill()
  state.value = {
    description: prefill.description,
    title: prefill.title,
    resumeFile: prefill.resumeFile || null,
    resumeName: prefill.resumeName,
  }
  if (import.meta.client) {
    try {
      sessionStorage.setItem(
        APPLY_PREFILL_STORAGE_KEY,
        JSON.stringify({
          description: prefill.description,
          title: prefill.title || '',
          resumeName: prefill.resumeName || '',
        }),
      )
    } catch {
      /* ignore quota */
    }
  }
}

export function consumeApplyPrefill(): ApplyBuilderPrefill | null {
  const state = useApplyBuilderPrefill()
  if (state.value?.description?.trim()) {
    const current = state.value
    state.value = null
    if (import.meta.client) {
      try {
        sessionStorage.removeItem(APPLY_PREFILL_STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
    return current
  }

  if (!import.meta.client) return null
  try {
    const raw = sessionStorage.getItem(APPLY_PREFILL_STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(APPLY_PREFILL_STORAGE_KEY)
    const parsed = JSON.parse(raw) as { description?: string; title?: string; resumeName?: string }
    if (!parsed.description?.trim()) return null
    return {
      description: parsed.description,
      title: parsed.title || '',
      resumeName: parsed.resumeName || '',
      resumeFile: null,
    }
  } catch {
    return null
  }
}

/**
 * Load scraped job + latest uploaded resume for builder Target Role prefill.
 * Prefer `?jobId=` from the job detail / tailor flow.
 */
export async function loadBuilderJobPrefill(jobIdRaw: unknown): Promise<BuilderJobPrefill | null> {
  const jobId = typeof jobIdRaw === 'string' ? jobIdRaw.trim() : ''
  if (!jobId) return null

  const [{ job }, docs] = await Promise.all([
    $fetch<{ job: Job }>(`/api/jobs/${jobId}`),
    $fetch<{
      resume: { contentText?: string; originalName?: string } | null
    }>('/api/documents').catch(() => ({ resume: null })),
  ])

  const description = String(job.description || '').trim()
  const resumeText = String(docs.resume?.contentText || '').trim()

  return {
    jobId,
    job,
    description,
    company: String(job.company || '').trim(),
    title: String(job.title || '').trim(),
    resumeText,
    resumeName: docs.resume?.originalName || 'Uploaded resume',
  }
}

export async function parseResumeTextToBuilder(
  text: string,
): Promise<Partial<BuilderResumeData> | null> {
  if (!text || text.length < 40) return null
  const parseRes = await $fetch<{ resumeData: BuilderResumeData }>('/api/ai/parse-resume', {
    method: 'POST',
    body: { text },
  })
  return parseRes.resumeData || null
}
