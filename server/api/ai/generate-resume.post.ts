import { createGeminiClient, resolveGeminiModel } from '../../utils/gemini'
import { formatGeminiError, getGeminiModels } from '../../utils/jobs'
import { withCredits } from '../../utils/withCredits'
import type { BuilderResumeData } from '~/shared/types/builder'

function hasUsableResume(resumeData: Record<string, unknown> | null | undefined, rawResumeText?: string) {
  if (typeof rawResumeText === 'string' && rawResumeText.trim().length > 40) return true
  if (!resumeData || typeof resumeData !== 'object') return false
  const info = (resumeData.personalInfo || {}) as Record<string, unknown>
  if (String(info.fullName || '').trim().length > 1) return true
  if (String(info.summary || '').replace(/<[^>]+>/g, '').trim().length > 20) return true
  if (Array.isArray(resumeData.experience) && resumeData.experience.length > 0) return true
  return false
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return trimmed
  const match = trimmed.match(/\{[\s\S]*\}/)
  return match ? match[0] : trimmed
}

export default withCredits(async (event) => {
  const body = await readBody(event)
  const {
    resumeData,
    jobDescription,
    additionalInstructions,
    rawResumeText,
    targetRole,
  } = body || {}

  const jd = typeof jobDescription === 'string' ? jobDescription.trim() : ''
  const resumeOk = hasUsableResume(resumeData, rawResumeText)
  const current = (resumeData && typeof resumeData === 'object' ? resumeData : {}) as BuilderResumeData

  if (!jd && !resumeOk) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Provide a job description and/or a resume (upload or contact/experience details) to draft a resume.',
    })
  }

  const extraInstructions =
    typeof additionalInstructions === 'string' ? additionalInstructions.trim() : ''
  const roleHint =
    (typeof targetRole === 'string' && targetRole.trim()) ||
    current.personalInfo?.jobTitle ||
    ''

  const rawResumeBlock =
    typeof rawResumeText === 'string' && rawResumeText.trim().length > 40
      ? `\nRaw resume text (use as additional grounding; do not invent facts):\n"""\n${rawResumeText.trim().slice(0, 12000)}\n"""\n`
      : ''

  const sourceNote = [
    resumeOk
      ? 'resume/profile details are available — ground all facts in them'
      : 'limited resume signal — strengthen what exists without inventing employers/degrees',
    jd
      ? 'a job description is available — tailor summary, bullets, and skills to it'
      : 'no job description — polish for clarity, impact, and ATS-friendly structure',
  ].join('; ')

  const userTasksBlock = extraInstructions
    ? `
ADDITIONAL USER INSTRUCTIONS (must follow when they do not require inventing facts):
${extraInstructions}
`
    : ''

  const ai = createGeminiClient()
  const primary = resolveGeminiModel()
  const models = [
    ...new Set(
      ['gemini-2.5-flash', primary, ...getGeminiModels(primary), 'gemini-2.0-flash'].filter(Boolean),
    ),
  ]

  const prompt = `You are an expert resume writer optimizing for clarity, impact, and ATS parseability.
Your task is to produce an updated resume JSON for the applicant.
Context: ${sourceNote}.
Target role hint: "${roleHint || 'professional role'}".

Current resume JSON:
"""
${JSON.stringify(current).slice(0, 16000)}
"""
${rawResumeBlock}
Target job description:
"""
${jd || '(Not provided — polish and structure the resume from available profile/resume text alone.)'}
"""
${userTasksBlock}

Rules:
- Return ONLY a valid JSON object with the FULL updated resume (same keys/shape as input).
- Preserve templateId, templateSlug, themeColor, language, name, sectionsOrder when present.
- Preserve targetJobDescription and additionalInstructions from the input when present.
- Preserve ids for experience/education/skills/projects/achievements/customSections when possible.
- Descriptions that are HTML must stay valid HTML using <p>/<ul>/<li>/<strong> only (no markdown).
- Never invent employers, degrees, companies, or metrics that are not grounded in the provided resume/raw text.
- When a job description is present, emphasize relevant skills and achievements and weave in missing keywords naturally.
- When only a resume is present, improve wording, bullet impact, and structure without changing facts.
- Ensure personalInfo.jobTitle aligns with the target role when a JD or role hint is provided.
- Do not add commentary outside the JSON object.`

  let lastError: unknown = null
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.45,
          responseMimeType: 'application/json',
        },
      })

      const raw = extractJsonObject(response.text || '')
      const fixed = JSON.parse(raw) as BuilderResumeData

      fixed.templateId = current.templateId || fixed.templateId
      fixed.templateSlug = current.templateSlug || fixed.templateSlug
      fixed.themeColor = current.themeColor ?? fixed.themeColor
      fixed.language = current.language || fixed.language
      fixed.name = current.name || fixed.name
      if (current.sectionsOrder) fixed.sectionsOrder = current.sectionsOrder
      if (current.targetJobDescription !== undefined) {
        fixed.targetJobDescription = current.targetJobDescription
      }
      if (current.additionalInstructions !== undefined) {
        fixed.additionalInstructions = current.additionalInstructions
      }
      if (jd) fixed.targetJobDescription = jd
      if (extraInstructions) fixed.additionalInstructions = extraInstructions

      if (!fixed.personalInfo) fixed.personalInfo = current.personalInfo
      if (!Array.isArray(fixed.experience)) fixed.experience = current.experience || []
      if (!Array.isArray(fixed.education)) fixed.education = current.education || []
      if (!Array.isArray(fixed.skills)) fixed.skills = current.skills || []
      if (!Array.isArray(fixed.projects)) fixed.projects = current.projects || []
      if (!Array.isArray(fixed.achievements)) fixed.achievements = current.achievements || []
      if (!Array.isArray(fixed.customSections)) fixed.customSections = current.customSections || []

      return { resumeData: fixed }
    } catch (error) {
      lastError = error
      console.error(`[generate-resume] model ${model} failed:`, error)
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: formatGeminiError(lastError) || 'Failed to generate resume',
  })
}, { reason: 'ai_generate_resume', requirePro: true, cost: 2 })
