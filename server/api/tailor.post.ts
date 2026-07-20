import type { Job } from '../../shared/types/job'
import type { CandidateProfile } from '../../shared/samples/candidateProfile'
import {
  hasUsableIdentity,
  normalizeCandidateProfile,
  stampCandidateIdentity,
  enforceExperienceBullets,
} from '../../shared/samples/candidateProfile'
import { getLatestDocuments } from '../utils/documents'
import { getGeminiModels } from '../utils/jobs'
import { createGeminiClient, tailorApplicationMaterials } from '../utils/gemini'
import { getJobById } from '../utils/jobRepository'
import { replaceEmDashes } from '../../shared/samples/professionalDocuments'
import { resolveCandidateProfileSync } from '../utils/candidateProfile'
import { withCredits } from '../utils/withCredits'

export default withCredits(async (event) => {
  const body = await readBody<{
    job?: Job
    jobId?: string
    resumeText?: string
    coverLetterText?: string
    useSavedDocuments?: boolean
    cvFormat?: string
    candidateProfile?: Partial<CandidateProfile> & {
      skillsText?: string
      experienceText?: string
    }
  }>(event)

  let job = body?.job

  if ((!job || !job.title) && body?.jobId) {
    const user = event.context.user
    if (!user?.id) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    job = (await getJobById(body.jobId, user.id)) || undefined
  }

  if (!job?.title) {
    throw createError({ statusCode: 400, statusMessage: 'Job details are required' })
  }

  let resumeText = body.resumeText?.trim() || ''
  let coverLetterText = body.coverLetterText?.trim() || ''

  if (body.useSavedDocuments !== false && (!resumeText || !coverLetterText)) {
    const docs = await getLatestDocuments()
    if (!resumeText && docs.resume) resumeText = docs.resume.contentText
    if (!coverLetterText && docs.coverLetter) coverLetterText = docs.coverLetter.contentText
  }

  const formProfile = normalizeCandidateProfile({
    ...body.candidateProfile,
    skillsText: body.candidateProfile?.skillsText,
    experienceText: body.candidateProfile?.experienceText,
  })

  const candidateProfile = resolveCandidateProfileSync({
    resumeText,
    candidateProfile: formProfile,
  })

  if (!resumeText && !hasUsableIdentity(candidateProfile)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Upload a CV or fill in your name, email, phone, and location before generating.',
    })
  }

  const config = useRuntimeConfig()
  const ai = createGeminiClient(config.geminiApiKey)

  const tailored = await tailorApplicationMaterials(
    ai,
    getGeminiModels(config.geminiModel),
    job,
    resumeText || undefined,
    coverLetterText || undefined,
    body.cvFormat,
    candidateProfile,
  )

  return {
    resume: stampCandidateIdentity(
      enforceExperienceBullets(replaceEmDashes(tailored.resume)),
      candidateProfile,
    ),
    coverLetter: stampCandidateIdentity(
      replaceEmDashes(tailored.coverLetter),
      candidateProfile,
    ),
    cvFormat: body.cvFormat || 'classic-professional',
    profile: {
      fullName: candidateProfile.fullName,
      email: candidateProfile.email,
      phone: candidateProfile.phone,
      location: candidateProfile.location,
    },
  }
}, { reason: 'ai_tailor', requirePro: true })
