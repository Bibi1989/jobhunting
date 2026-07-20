import type { ApplicationQuestion, Job } from '../../../shared/types/job'
import { answerApplicationQuestions } from '../../utils/applicationForm'
import { getLatestDocuments } from '../../utils/documents'
import { createGeminiClient } from '../../utils/gemini'
import { getGeminiModels } from '../../utils/jobs'
import { getJobById } from '../../utils/jobRepository'
import { withCredits } from '../../utils/withCredits'

export default withCredits(
  async (event) => {
    const body = await readBody<{
      job?: Job
      jobId?: string
      questions?: ApplicationQuestion[]
      resumeText?: string
      coverLetterText?: string
    }>(event)

    let job = body?.job
    if ((!job || !job.title) && body?.jobId) {
      job = (await getJobById(body.jobId)) || undefined
    }

    if (!job?.title) {
      throw createError({ statusCode: 400, statusMessage: 'Job details are required' })
    }

    if (!body?.questions?.length) {
      throw createError({ statusCode: 400, statusMessage: 'questions are required' })
    }

    let resumeText = body.resumeText?.trim() || ''
    let coverLetterText = body.coverLetterText?.trim() || ''

    if (!resumeText || !coverLetterText) {
      const docs = await getLatestDocuments()
      if (!resumeText && docs.resume) resumeText = docs.resume.contentText
      if (!coverLetterText && docs.coverLetter) coverLetterText = docs.coverLetter.contentText
    }

    const config = useRuntimeConfig()
    const ai = createGeminiClient(config.geminiApiKey)

    const questions = await answerApplicationQuestions(
      ai,
      getGeminiModels(config.geminiModel),
      job,
      body.questions,
      resumeText || undefined,
      coverLetterText || undefined,
    )

    return { questions }
  },
  { reason: 'ai_application_answer', requirePro: true },
)
