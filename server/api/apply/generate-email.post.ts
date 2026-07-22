import { createGeminiClient, resolveGeminiModelChain } from '../../utils/gemini'
import { withCareerExpertPrompt, careerExpertGenerateConfig } from '../../utils/careerExpertPrompt'
import { formatGeminiError } from '../../utils/jobs'
import { withCredits } from '../../utils/withCredits'
import type { BuilderResumeData } from '~/shared/types/builder'

function stripHtml(html?: string | null): string {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resumeSnippet(resume?: BuilderResumeData | null, rawResumeText?: string): string {
  if (typeof rawResumeText === 'string' && rawResumeText.trim().length > 40) {
    return rawResumeText.trim().slice(0, 6000)
  }
  if (!resume) return ''
  const parts: string[] = []
  const p = resume.personalInfo
  if (p?.fullName) parts.push(`Name: ${p.fullName}`)
  if (p?.jobTitle) parts.push(`Headline: ${p.jobTitle}`)
  if (p?.summary) parts.push(`Summary: ${stripHtml(p.summary)}`)
  for (const exp of (resume.experience || []).slice(0, 4)) {
    parts.push(`Experience: ${exp.title} at ${exp.company} — ${stripHtml(exp.description).slice(0, 400)}`)
  }
  for (const skill of (resume.skills || []).slice(0, 12)) {
    if (skill.name) parts.push(`Skill: ${skill.name}`)
  }
  return parts.join('\n').slice(0, 6000)
}

export default withCredits(async (event) => {
  const body = await readBody(event)
  const jobTitle = String(body?.jobTitle || '').trim()
  const jobDescription = String(body?.jobDescription || '').trim()
  const resumeData = body?.resumeData as BuilderResumeData | undefined
  const rawResumeText = typeof body?.rawResumeText === 'string' ? body.rawResumeText : ''
  const coverLetterText = typeof body?.coverLetterText === 'string' ? body.coverLetterText : ''

  if (!jobTitle && !jobDescription) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Provide a job title and/or job description to generate the email.',
    })
  }

  const candidateName = resumeData?.personalInfo?.fullName || 'the candidate'
  const snippet = resumeSnippet(resumeData, rawResumeText)

  const task = `Write a concise, professional job application EMAIL (plain text only — no HTML, no markdown).

Candidate: ${candidateName}
Target role: ${jobTitle || '(not specified)'}
Job description:
"""
${jobDescription || '(not provided)'}
"""

Candidate background (for tailoring):
"""
${snippet || '(not provided)'}
"""
${coverLetterText ? `\nCover letter excerpt:\n"""\n${coverLetterText.slice(0, 2000)}\n"""` : ''}

Return ONLY valid JSON with this exact shape:
{"subject":"...","bodyText":"..."}

Rules:
- subject: one line, professional (include role and candidate name when possible)
- bodyText: 3–5 short paragraphs, plain text, line breaks between paragraphs
- Mention attached resume${coverLetterText ? ' and cover letter' : ''} naturally
- Do not invent employers, dates, or credentials not supported by the background
- Sign off with the candidate's name if known`

  const ai = createGeminiClient()
  const models = resolveGeminiModelChain()

  let lastError: unknown
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: withCareerExpertPrompt(task),
        config: careerExpertGenerateConfig({ temperature: 0.5 }),
      })
      const raw = String(response.text || '').trim()
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in model response')
      const parsed = JSON.parse(jsonMatch[0]) as { subject?: string; bodyText?: string }
      const subject = String(parsed.subject || '').trim()
      const bodyText = String(parsed.bodyText || '').trim()
      if (!subject || !bodyText) {
        throw createError({ statusCode: 502, statusMessage: 'AI returned an empty email.' })
      }
      return { subject, bodyText }
    } catch (err) {
      lastError = err
      if (err && typeof err === 'object' && 'statusCode' in err) throw err
    }
  }

  throw createError({
    statusCode: 502,
    statusMessage: formatGeminiError(lastError),
  })
}, { reason: 'ai_apply_email_generate', requirePro: true, cost: 1 })
