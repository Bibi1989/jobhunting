import { createGeminiClient, resolveGeminiModelChain } from '../../utils/gemini'
import {
  careerExpertGenerateConfig,
  resumeGroundingBlock,
} from '../../utils/careerExpertPrompt'
import { parseModelJson } from '../../utils/jsonParse'
import { formatGeminiError } from '../../utils/jobs'
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

  const grounding = resumeGroundingBlock(current, rawResumeText, { jsonMax: 14000, rawMax: 8000 })

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

  let presetRules = ''
  if (body?.tailoringPreset === 'ats-first') {
    presetRules = `
- PERSONALITY PRESET: ATS-First. Optimize the resume draft for maximum keyword alignment with the job description. Rephrase summary, experience bullet points, and skills list to directly match terms in the target job description. Avoid subjective claims and maintain a standardized tone.`
  } else if (body?.tailoringPreset === 'impact-first') {
    presetRules = `
- PERSONALITY PRESET: Impact/Metrics-First. Emphasize numeric results, metrics, and business outcomes. Frame experience bullets strictly in the Google XYZ structure: "Accomplished [X], as measured by [Y], by doing [Z]" with numeric success indicators. Ensure every single job highlights quantifiable outcomes.`
  } else if (body?.tailoringPreset === 'leadership') {
    presetRules = `
- PERSONALITY PRESET: Leadership. Showcase mentoring, project leadership, strategic vision, technical ownership, and stakeholder coordination. Highlight ownership and mentoring duties in experience descriptions.`
  } else if (body?.tailoringPreset === 'tech-expert') {
    presetRules = `
- PERSONALITY PRESET: Tech Expert. Focus on deep engineering detail. Highlight specific libraries, databases, frameworks, infrastructure details, API design patterns, and complexity. Make the technical implementation details prominent.`
  }

  const ai = createGeminiClient()
  const models = resolveGeminiModelChain()

  const prompt = `Your task is to produce an updated resume JSON for the applicant.
Context: ${sourceNote}.
Target role hint: "${roleHint || 'professional role'}".

${grounding}
Target job description:
"""
${(jd || '(Not provided — polish and structure the resume from available profile/resume text alone.)').slice(0, 8000)}
"""
${userTasksBlock}
${presetRules}

Rules:
- Return ONLY a valid JSON object with the FULL updated resume (same keys/shape as input).
- Preserve templateId, templateSlug, themeColor, language, name, sectionsOrder when present.
- Preserve targetJobDescription and additionalInstructions from the input when present.
- Preserve ids for experience/education/skills/projects/achievements/customSections when possible.
- Descriptions that are HTML must stay valid HTML using <p>/<ul>/<li>/<strong> only (no markdown).
- Experience/work history bullets within <li> tags MUST follow the Google XYZ structure: "Accomplished [X], as measured by [Y], by doing [Z]."
- Each experience bullet MUST begin with a strong, precise action verb (e.g., Engineered, Architected, Refactored, Provisioned).
- Do not use brackets or placeholders (e.g., do not write [X%] or [X ms]). If quantitative metrics are not explicitly provided, estimate and insert realistic, technically-defensible metrics (e.g., 20%, 350ms, 15) that logically align with the described achievements. Never invent fake companies or dates.
- When a job description is present, emphasize relevant skills and achievements and weave in missing keywords naturally.
- When only a resume is present, improve wording, bullet impact, and structure without changing facts.
- Ensure personalInfo.jobTitle aligns with the target role when a JD or role hint is provided.
- Keep experience/project HTML descriptions concise (typically 3–5 bullets) so the JSON completes fully.
- Do not add commentary outside the JSON object.`

  let lastError: unknown = null
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: careerExpertGenerateConfig({
          temperature: 0.45,
          responseMimeType: 'application/json',
        }),
      })

      const fixed = parseModelJson<BuilderResumeData>(response.text || '')

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
