import type { Job } from '../../shared/types/job'
import { enrichJobsWithFullDescriptions } from '../utils/enrichJobs'
import { getGeminiModels } from '../utils/jobs'
import {
  createGeminiClient,
  extractJobsFromHtml,
  filterJobsByTarget,
  hasScrapeTarget,
  resolveGeminiModel,
  resolveGeminiParsekitModel,
  searchJobsForUrl,
  type JobScrapeTarget,
} from '../utils/gemini'
import { getLatestDocuments } from '../utils/documents'
import { createScrapeRun, upsertJobs } from '../utils/jobRepository'
import {
  cleanHtmlForExtraction,
  fetchPageHtml,
  shouldUseSearchFallback,
} from '../utils/scraper'
import { withCredits } from '../utils/withCredits'
import { extractJobTitleFromResumeText } from '../../shared/utils/resumeJobTitle'

export default withCredits(
  async (event) => {
    const body = await readBody<{
      url?: string
      useResume?: boolean
      useCoverLetter?: boolean
      jobTitle?: string
      /** Optional client-extracted job stubs (e.g. Chrome extension list detect). */
      jobs?: Array<{
        title?: string
        company?: string
        location?: string
        url?: string
        description?: string
      }>
    }>(event)
    const url = body?.url?.trim()
    const manualJobTitle = body?.jobTitle?.trim() || ''

    if (!url) {
      throw createError({ statusCode: 400, statusMessage: 'URL is required' })
    }

    const clientJobs: Job[] = Array.isArray(body?.jobs)
      ? body.jobs
          .map((j) => ({
            title: String(j?.title || '').trim() || 'Untitled role',
            company: String(j?.company || '').trim() || undefined,
            location: String(j?.location || '').trim() || 'Remote',
            url: String(j?.url || '').trim(),
            description: String(j?.description || '').trim() || undefined,
          }))
          .filter((j) => /^https?:\/\//i.test(j.url))
          .slice(0, 60)
      : []

    let target: JobScrapeTarget | null = null
    let resolvedJobTitle = manualJobTitle

    if (body?.useResume || body?.useCoverLetter || manualJobTitle) {
      const user = event.context.user
      if (!user?.id) {
        throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
      }
      const docs = await getLatestDocuments(user.id)
      if (body.useResume && !docs.resume?.contentText?.trim()) {
        throw createError({
          statusCode: 400,
          statusMessage: 'No resume uploaded. Upload a resume or uncheck “Use resume”.',
        })
      }
      if (body.useCoverLetter && !docs.coverLetter?.contentText?.trim()) {
        throw createError({
          statusCode: 400,
          statusMessage:
            'No cover letter uploaded. Upload a cover letter or uncheck “Use cover letter”.',
        })
      }

      const resumeText = body.useResume ? docs.resume?.contentText : undefined
      if (!resolvedJobTitle && resumeText) {
        resolvedJobTitle = extractJobTitleFromResumeText(resumeText)
      }

      target = {
        jobTitle: resolvedJobTitle || undefined,
        resumeText,
        coverLetterText: body.useCoverLetter ? docs.coverLetter?.contentText : undefined,
      }
      if (!hasScrapeTarget(target)) {
        target = null
      }
    }

    const ai = createGeminiClient()
    const models = getGeminiModels(resolveGeminiModel())

    let jobs: Job[] = []
    let usedSearch = false
    let finalUrl = url
    let statusText = 'ok'
    let sourceFromClient = false

    if (clientJobs.length > 0) {
      sourceFromClient = true
      jobs = clientJobs
      statusText = `client list (${clientJobs.length})`
    } else {
      const { html, isError, statusText: fetchStatus, status, finalUrl: fetchedUrl } =
        await fetchPageHtml(url)
      finalUrl = fetchedUrl
      statusText = fetchStatus
      const cleanedHtml = isError ? '' : cleanHtmlForExtraction(html, finalUrl)

      if (shouldUseSearchFallback(isError, cleanedHtml, status)) {
        usedSearch = true
        const reason = isError ? `fetch failed: ${statusText}` : `page unusable (${statusText})`
        jobs = await searchJobsForUrl(ai, models, finalUrl, reason, target)
      } else {
        jobs = await extractJobsFromHtml(ai, models, cleanedHtml, finalUrl, target)

        if (jobs.length === 0) {
          usedSearch = true
          jobs = await searchJobsForUrl(
            ai,
            models,
            finalUrl,
            'no jobs found in page HTML (likely JavaScript-rendered)',
            target,
          )
        }
      }
    }

    if (hasScrapeTarget(target) && jobs.length > 0) {
      jobs = await filterJobsByTarget(ai, models, jobs, target)
    }

    // Fetch each job detail page and extract the full JD (responsibilities, requirements, etc.)
    jobs = await enrichJobsWithFullDescriptions(
      ai,
      getGeminiModels(resolveGeminiParsekitModel()),
      jobs,
      finalUrl,
    )

    const user = event.context.user
    if (!user?.id) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    const scrapeRunId = await createScrapeRun({
      userId: user.id,
      sourceUrl: url,
      finalUrl,
      usedSearch,
      sourceStatus: statusText,
      jobCount: jobs.length,
    })

    const savedJobs = await upsertJobs(jobs, scrapeRunId, url, user.id)

    return {
      jobs: savedJobs,
      meta: {
        count: savedJobs.length,
        usedSearch,
        targeted: Boolean(hasScrapeTarget(target)),
        targetJobTitle: resolvedJobTitle || null,
        sourceStatus: statusText,
        scrapeRunId,
        sourceFromClient,
        enriched: savedJobs.filter((j) => j.descriptionSource === 'detail_page').length,
      },
    }
  },
  { reason: 'job_scrape', requirePro: true, cost: 1 },
)
