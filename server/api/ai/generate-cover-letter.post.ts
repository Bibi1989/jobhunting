import { createGeminiClient, resolveGeminiModelChain } from '../../utils/gemini'
import {
  careerExpertGenerateConfig,
  resolveUseMetrics,
  resumeGroundingBlock,
} from '../../utils/careerExpertPrompt'
import { formatGeminiError } from '../../utils/jobs'
import { withCredits } from '../../utils/withCredits'

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
}

function cleanHtmlResponse(text: string) {
  return text
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

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
    tone,
    jobDescription,
    companyName,
    hiringManager,
    currentContent,
    additionalInstructions,
    rawResumeText,
  } = body || {}

  const jd = typeof jobDescription === 'string' ? jobDescription.trim() : ''
  const company = typeof companyName === 'string' ? companyName.trim() : ''
  const resumeOk = hasUsableResume(resumeData, rawResumeText)

  if (!jd && !resumeOk) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Provide a job description and/or a resume (upload or contact/experience details) to draft a cover letter.',
    })
  }

  const personalInfo = resumeData?.personalInfo || {}
  const experiences = Array.isArray(resumeData?.experience) ? resumeData.experience : []
  const education = Array.isArray(resumeData?.education) ? resumeData.education : []
  const skills = Array.isArray(resumeData?.skills) ? resumeData.skills : []
  const applicantName = String(personalInfo.fullName || '').trim() || 'the applicant'
  const useMetrics =
    resolveUseMetrics(body?.useMetrics, resumeData) || body?.tailoringPreset === 'impact-first'

  const hasExistingDraft =
    typeof currentContent === 'string' && stripHtml(currentContent).length > 20

  const extraInstructions =
    typeof additionalInstructions === 'string' ? additionalInstructions.trim() : ''

  const ai = createGeminiClient()
  const models = resolveGeminiModelChain()

  const enhanceBlock = hasExistingDraft
    ? `
MODE: AI ENHANCEMENT (not a blank rewrite from scratch).
Improve and tighten the applicant's existing draft below while preserving their voice and intent.
Keep the required structure (intro → bullets → ownership → close) unless clarity clearly benefits from light reorganization.
Existing draft HTML:
${String(currentContent).slice(0, 4000)}
`
    : `
MODE: Create a strong first draft from the available resume and/or job details.
`

  const userTasksBlock = extraInstructions
    ? `
ADDITIONAL USER INSTRUCTIONS (must follow; these override length/style defaults when they conflict):
${extraInstructions}
`
    : ''

  const salutationName =
    (typeof hiringManager === 'string' && hiringManager.trim()) || 'Hiring Team'
  const companyLabel = company || 'the hiring organization'

  // Prefer compact structured fields; only fall back to raw text when thin
  const structuredEnough =
    String(personalInfo.fullName || '').trim().length > 1 &&
    (experiences.length > 0 || String(personalInfo.summary || '').replace(/<[^>]+>/g, '').trim().length > 20)

  const resumeContext = structuredEnough
    ? `Applicant Information (from their Resume):
Name: ${personalInfo.fullName || 'Applicant'}
Job Title: ${personalInfo.jobTitle || ''}
Email: ${personalInfo.email || ''}
Phone: ${personalInfo.phone || ''}
Location: ${personalInfo.location || ''}
Summary: ${String(personalInfo.summary || '').slice(0, 2000)}

Experiences:
${JSON.stringify(experiences.slice(0, 6), null, 2).slice(0, 8000)}

Education:
${JSON.stringify(education.slice(0, 4), null, 2).slice(0, 2000)}

Skills:
${JSON.stringify(skills.slice(0, 24), null, 2).slice(0, 1500)}
`
    : resumeGroundingBlock(resumeData, rawResumeText, { jsonMax: 10000, rawMax: 8000 })

  const sourceNote = [
    resumeOk ? 'resume/profile details are available' : 'no detailed resume — write a strong generic-but-professional letter',
    jd ? 'a job description is available — tailor to it' : 'no job description — emphasize transferable strengths and interest in the role/company',
  ].join('; ')

  let presetRules = ''
  if (body?.tailoringPreset === 'ats-first') {
    presetRules = `
- PERSONALITY PRESET: ATS-First. Optimize for strict keyword alignment with the job description. Incorporate key skills and requirement phrases directly. Keep the tone highly direct and objective.`
  } else if (body?.tailoringPreset === 'impact-first') {
    presetRules = `
- PERSONALITY PRESET: Impact/Metrics-First. Prioritize the strongest quantified outcomes from the CV that map to the JD. Put those in the bulleted middle section.`
  } else if (body?.tailoringPreset === 'leadership') {
    presetRules = `
- PERSONALITY PRESET: Leadership. Showcase mentoring, project leadership, initiative, and cross-functional ownership in the bullets and ownership paragraph.`
  } else if (body?.tailoringPreset === 'tech-expert') {
    presetRules = `
- PERSONALITY PRESET: Tech Expert. Deepen technical descriptions. Highlight specific libraries, databases, frameworks, reliability work, or architecture decisions that appear in both CV and JD.`
  }

  const prompt = `Produce a tailored, human-sounding cover letter for this applicant.
Context: ${sourceNote}.
${presetRules}

${resumeContext}
Target Job Details:
Company Name: ${companyLabel}
Hiring Manager / Team: ${salutationName}
Job Description:
${(jd || '(Not provided — draft a compelling letter from the resume/profile alone, suitable for a general application.)').slice(0, 8000)}

Tone requested: ${tone || 'professional'} (match this tone exactly).
${enhanceBlock}
${userTasksBlock}

CRITICAL OUTPUT RULES:
- Write the entire cover letter body in well-formatted HTML for a rich text editor.
- Use <p> for paragraphs and <ul><li> for the achievement list. Do not wrap the response in markdown fences.
- Do NOT include the applicant's contact header, postal address block, or the current date — the PDF template already prints those.
- Do NOT invent a recipient company address block.
- Start with an optional subject line when a clear job title exists in the JD:
  <p><strong>Re: Application for [Job Title from JD]</strong></p>
- Then salutation: <p>Dear ${salutationName},</p>
- Then follow this exact narrative structure:

  [Paragraph 1 — Direct Introduction]
  Open as a working engineer (or the applicant's real role family from the CV), with years of experience extracted from the CV, the product surface they build (frontend / fullstack / backend / cloud), and the core tech stack that overlaps the JD. One short paragraph. No "I am excited to apply" or robotic corporate openers.

  [Paragraph 2 — Context + Bulleted Metrics]
  One short framing sentence about recent work (prefer a real company/project from the CV), then a <ul> with 3–4 <li> items. Each item MUST start with <strong>Key Area</strong>: followed by an action verb, concrete tech from the CV, and a JD-aligned outcome${useMetrics ? ' (prefer quantified impact from the CV)' : ' (keep existing CV numbers only; do not invent new metrics)'}.

  [Paragraph 3 — Ownership & Value Add]
  Tie end-to-end ownership (infra, performance, workflows — only if grounded in the CV) to genuine interest in ${companyLabel}. Stay specific; no fluff.

  [Closing]
  Thank them briefly, invite a conversation, then:
  <p>Sincerely,</p>
  <p>${applicantName}</p>

- Mirror exact technical keywords, tools, and terminology from the Job Description naturally.
- Keep the body concise (~250–350 words) so it fits one A4 page with the template header.
- Output ONLY the HTML string.`

  let lastError: unknown = null
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: careerExpertGenerateConfig(
          {
            temperature: 0.7,
          },
          { useMetrics, documentKind: 'cover_letter' },
        ),
      })

      const text = cleanHtmlResponse(response.text || '')
      if (!text || stripHtml(text).length < 20) {
        throw new Error('Model returned an empty cover letter')
      }

      return { content: text }
    } catch (error) {
      lastError = error
      console.error(`[generate-cover-letter] model ${model} failed:`, error)
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: formatGeminiError(lastError) || 'Failed to generate cover letter',
  })
}, { reason: 'ai_cover_letter', requirePro: true })
