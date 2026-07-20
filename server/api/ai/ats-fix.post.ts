import { createGeminiClient } from '../../utils/gemini'
import { withCredits } from '../../utils/withCredits'
import { builderResumeToMarkdown } from '~/utils/builderToMarkdown'
import type { BuilderResumeData } from '~/shared/types/builder'

type AtsIssue = {
  severity?: string
  category?: string
  message?: string
  suggestion?: string
}

type AtsCheckResult = {
  score?: number
  summary?: string
  issues?: AtsIssue[]
  keywordGaps?: string[]
  quickWins?: string[]
}

/**
 * Apply ATS audit findings to the resume builder payload.
 * Returns a full BuilderResumeData object (same shape as input).
 */
export default withCredits(async (event) => {
  const body = await readBody(event)
  const resumeData = body?.resumeData as BuilderResumeData | undefined
  const atsResult = body?.atsResult as AtsCheckResult | undefined
  const jobDescription = typeof body?.jobDescription === 'string' ? body.jobDescription : ''

  if (!resumeData || typeof resumeData !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Resume data is required' })
  }
  if (!atsResult || typeof atsResult !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Run ATS Check first, then fix.' })
  }

  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Gemini API key is not configured' })
  }

  const markdown = builderResumeToMarkdown(resumeData)
  const issues = Array.isArray(atsResult.issues) ? atsResult.issues : []
  const gaps = Array.isArray(atsResult.keywordGaps) ? atsResult.keywordGaps : []
  const wins = Array.isArray(atsResult.quickWins) ? atsResult.quickWins : []

  const ai = createGeminiClient(apiKey)
  const prompt = `You are an expert resume writer optimizing for ATS parseability.
Apply the audit findings to improve this resume JSON. Keep the same JSON schema/shape.

Target role: "${resumeData.personalInfo?.jobTitle || 'professional'}"
${jobDescription.trim() ? `Job description excerpt:\n"""\n${jobDescription.trim().slice(0, 4000)}\n"""\n` : ''}

ATS score: ${atsResult.score ?? 'n/a'}
Summary: ${atsResult.summary || ''}
Issues:
${issues.map((i) => `- [${i.severity}] ${i.category}: ${i.message} → ${i.suggestion}`).join('\n') || '(none)'}
Keyword gaps: ${gaps.join(', ') || '(none)'}
Quick wins: ${wins.join('; ') || '(none)'}

Current resume markdown (reference):
"""
${markdown.slice(0, 10000)}
"""

Current resume JSON:
"""
${JSON.stringify(resumeData).slice(0, 14000)}
"""

Rules:
- Return ONLY a valid JSON object with the FULL updated resume (same keys as input).
- Preserve all ids for experience/education/skills/projects/achievements/customSections when possible.
- Keep templateId, themeColor, language, name unchanged.
- Improve summary, bullets, skills, and section wording for ATS + the target role.
- Descriptions that are HTML must stay valid HTML using <p>/<ul>/<li>/<strong> only (no markdown).
- Do not invent fake employers or degrees; strengthen existing content and weave in missing keywords naturally.
- Do not add commentary outside the JSON object.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    })

    const raw = (response.text || '').trim()
    const fixed = JSON.parse(raw) as BuilderResumeData

    // Preserve identity fields the model must not rewrite away
    fixed.templateId = resumeData.templateId
    fixed.themeColor = resumeData.themeColor
    fixed.language = resumeData.language
    fixed.name = resumeData.name

    // Ensure required nested objects exist
    if (!fixed.personalInfo) fixed.personalInfo = resumeData.personalInfo
    if (!Array.isArray(fixed.experience)) fixed.experience = resumeData.experience
    if (!Array.isArray(fixed.education)) fixed.education = resumeData.education
    if (!Array.isArray(fixed.skills)) fixed.skills = resumeData.skills
    if (!Array.isArray(fixed.projects)) fixed.projects = resumeData.projects || []
    if (!Array.isArray(fixed.achievements)) fixed.achievements = resumeData.achievements || []
    if (!Array.isArray(fixed.customSections)) fixed.customSections = resumeData.customSections || []

    return { resumeData: fixed }
  } catch (error: unknown) {
    console.error('ATS fix error:', error)
    const message = error instanceof Error ? error.message : 'Failed to apply ATS fixes'
    throw createError({ statusCode: 500, statusMessage: message })
  }
}, { reason: 'ai_ats_fix', requirePro: true, cost: 3 })
