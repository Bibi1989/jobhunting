import { createGeminiClient, resolveGeminiModel } from '../../utils/gemini'
import { withCareerExpertPrompt, careerExpertGenerateConfig } from '../../utils/careerExpertPrompt'
import { withCredits } from '../../utils/withCredits'
import { builderResumeToMarkdown } from '~/utils/builderToMarkdown'

export type AtsIssue = {
  severity: 'critical' | 'warning' | 'info'
  category: string
  message: string
  suggestion: string
}

export type AtsKeywordAnalysis = {
  keyword: string
  status: 'missing' | 'found'
  count: number
  foundInSection: 'experience' | 'projects' | 'skills' | 'summary' | 'none'
}

export type AtsSuggestedRewrite = {
  original: string
  suggested: string
  explanation: string
}

export type AtsSectionChangeProposal = {
  section: 'experience' | 'projects' | 'skills' | 'summary'
  relevanceReason: string
  suggestedRewrites: AtsSuggestedRewrite[]
}

export type AtsCheckResult = {
  score: number
  grade: string
  summary: string
  strengths: string[]
  issues: AtsIssue[]
  keywordGaps: string[]
  quickWins: string[]
  keywordsAnalysis?: AtsKeywordAnalysis[]
  sectionChanges?: AtsSectionChangeProposal[]
}

export default withCredits(async (event) => {
  const body = await readBody(event)
  const { resumeData, targetRole, jobDescription } = body || {}

  if (!resumeData || typeof resumeData !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Resume data is required for ATS check',
    })
  }

  let markdown = ''
  try {
    markdown = builderResumeToMarkdown(resumeData)
  } catch {
    markdown = JSON.stringify(resumeData)
  }

  if (!markdown.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Resume appears empty — add content before running ATS check',
    })
  }

  const roleHint = typeof targetRole === 'string' && targetRole.trim()
    ? targetRole.trim()
    : resumeData?.personalInfo?.jobTitle || 'general professional role'

  const jdBlock =
    typeof jobDescription === 'string' && jobDescription.trim()
      ? `\n\nTarget job description:\n"""\n${jobDescription.trim().slice(0, 6000)}\n"""`
      : ''

  const ai = createGeminiClient()
  const model = resolveGeminiModel()

  const prompt = withCareerExpertPrompt(`Analyze this resume for ATS parseability and hiring-manager fitness for the target role: "${roleHint}".

Resume (markdown):
"""
${markdown.slice(0, 12000)}
"""${jdBlock}

Score 0–100 for ATS readiness. Be practical and specific.
Focus on: contact fields, section clarity, keyword alignment, measurable bullets, formatting risks (tables/graphics), length, and missing essentials.

Provide a thorough analysis of the keywords: identify which key technical skills, tools, and terminology from the job description are missing, which ones are found, and in which section of the resume (experience, projects, skills, summary, or none) they appear.
Also specify what sections should change and suggest exact rewrites for 1-2 bullets/paragraphs per section to demonstrate how they can incorporate missing keywords or transition to the Google XYZ bullet format.

Return ONLY valid JSON matching this schema (no markdown fences):
{
  "score": number,
  "grade": string,
  "summary": string,
  "strengths": string[],
  "issues": [{ "severity": "critical"|"warning"|"info", "category": string, "message": string, "suggestion": string }],
  "keywordGaps": string[],
  "quickWins": string[],
  "keywordsAnalysis": [{
    "keyword": string,
    "status": "missing" | "found",
    "count": number,
    "foundInSection": "experience" | "projects" | "skills" | "summary" | "none"
  }],
  "sectionChanges": [{
    "section": "experience" | "projects" | "skills" | "summary",
    "relevanceReason": string,
    "suggestedRewrites": [{
      "original": string,
      "suggested": string,
      "explanation": string
    }]
  }]
}`)

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: careerExpertGenerateConfig({
        temperature: 0.3,
        responseMimeType: 'application/json',
      }),
    })

    const raw = (response.text || '').trim()
    const parsed = JSON.parse(raw) as AtsCheckResult

    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0))
    const grade =
      parsed.grade ||
      (score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F')

    return {
      score,
      grade,
      summary: String(parsed.summary || ''),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 8) : [],
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.slice(0, 12).map((issue) => ({
            severity: (['critical', 'warning', 'info'].includes(issue?.severity)
              ? issue.severity
              : 'warning') as AtsIssue['severity'],
            category: String(issue?.category || 'General'),
            message: String(issue?.message || ''),
            suggestion: String(issue?.suggestion || ''),
          }))
        : [],
      keywordGaps: Array.isArray(parsed.keywordGaps)
        ? parsed.keywordGaps.map(String).slice(0, 12)
        : [],
      quickWins: Array.isArray(parsed.quickWins)
        ? parsed.quickWins.map(String).slice(0, 8)
        : [],
      keywordsAnalysis: Array.isArray(parsed.keywordsAnalysis)
        ? parsed.keywordsAnalysis.map((k) => ({
            keyword: String(k.keyword || ''),
            status: (['missing', 'found'].includes(k.status) ? k.status : 'missing') as 'missing' | 'found',
            count: Number(k.count) || 0,
            foundInSection: (['experience', 'projects', 'skills', 'summary', 'none'].includes(k.foundInSection)
              ? k.foundInSection
              : 'none') as 'experience' | 'projects' | 'skills' | 'summary' | 'none',
          }))
        : [],
      sectionChanges: Array.isArray(parsed.sectionChanges)
        ? parsed.sectionChanges.map((sc) => ({
            section: (['experience', 'projects', 'skills', 'summary'].includes(sc.section)
              ? sc.section
              : 'experience') as 'experience' | 'projects' | 'skills' | 'summary',
            relevanceReason: String(sc.relevanceReason || ''),
            suggestedRewrites: Array.isArray(sc.suggestedRewrites)
              ? sc.suggestedRewrites.map((sr) => ({
                  original: String(sr.original || ''),
                  suggested: String(sr.suggested || ''),
                  explanation: String(sr.explanation || ''),
                }))
              : [],
          }))
        : [],
    } satisfies AtsCheckResult
  } catch (error: unknown) {
    console.error('ATS check error:', error)
    const message = error instanceof Error ? error.message : 'Failed to run ATS check'
    throw createError({
      statusCode: 500,
      statusMessage: message,
    })
  }
}, { reason: 'ai_ats_check', requirePro: true, cost: 2 })
