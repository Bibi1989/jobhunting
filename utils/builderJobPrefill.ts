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
