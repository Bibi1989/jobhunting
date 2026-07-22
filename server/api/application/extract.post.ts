import type { Job } from '../../../shared/types/job'
import {
  answerApplicationQuestions,
  extractApplicationForm,
} from '../../utils/applicationForm'
import { getLatestDocuments } from '../../utils/documents'
import { createGeminiClient, resolveGeminiParsekitModel } from '../../utils/gemini'
import { getGeminiModels } from '../../utils/jobs'
import { getJobById } from '../../utils/jobRepository'
import { withCredits } from '../../utils/withCredits'

export default withCredits(
  async (event) => {
    const body = await readBody<{
      job?: Job
      jobId?: string
      answer?: boolean
      resumeText?: string
      coverLetterText?: string
    }>(event)

    let job = body?.job
    if ((!job || !job.title) && body?.jobId) {
      const user = event.context.user
      if (!user?.id) {
        throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
      }
      job = (await getJobById(body.jobId, user.id)) || undefined
    }

    if (!job?.title || !job.url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Job with title and url is required',
      })
    }

    const ai = createGeminiClient()
    const models = getGeminiModels(resolveGeminiParsekitModel())

    const form = await extractApplicationForm(ai, models, job)

    if (body?.answer !== false && form.questions.length > 0) {
      let resumeText = body.resumeText?.trim() || ''
      let coverLetterText = body.coverLetterText?.trim() || ''

      if (!resumeText || !coverLetterText) {
        const user = event.context.user
        if (!user?.id) {
          throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
        }
        const docs = await getLatestDocuments(user.id)
        if (!resumeText && docs.resume) resumeText = docs.resume.contentText
        if (!coverLetterText && docs.coverLetter) coverLetterText = docs.coverLetter.contentText
      }

      form.questions = await answerApplicationQuestions(
        ai,
        models,
        job,
        form.questions,
        resumeText || undefined,
        coverLetterText || undefined,
      )
    }

    return { form }
  },
  { reason: 'ai_application_extract', requirePro: true },
)
