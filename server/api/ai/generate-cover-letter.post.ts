import { createGeminiClient, resolveGeminiModelChain } from '../../utils/gemini'
import {
  careerExpertGenerateConfig,
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
Keep structure unless clarity clearly benefits from light reorganization.
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

  const salutationName = (hiringManager || 'Hiring Manager').toString().trim() || 'Hiring Manager'
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
- PERSONALITY PRESET: ATS-First. Optimize the cover letter for strict keyword alignment with the job description. Directly incorporate key skills and requirement phrases from the job description. Keep the tone highly direct and objective.`
  } else if (body?.tailoringPreset === 'impact-first') {
    presetRules = `
- PERSONALITY PRESET: Impact/Metrics-First. Focus heavily on quantitative achievements, metrics, and business outcomes. Highlight achievements with clear percentages, statistics, or scale values in the middle paragraphs.`
  } else if (body?.tailoringPreset === 'leadership') {
    presetRules = `
- PERSONALITY PRESET: Leadership. Showcase mentoring, project leadership, strategic vision, initiative, and cross-functional collaboration. Highlight experience taking ownership and guiding teams.`
  } else if (body?.tailoringPreset === 'tech-expert') {
    presetRules = `
- PERSONALITY PRESET: Tech Expert. Deepen technical descriptions. Highlight specific libraries, databases, frameworks, system reliability, or complex architecture decisions.`
  }

  const prompt = `Your task is to produce a highly persuasive, customized cover letter for a job applicant.
Context: ${sourceNote}.
${presetRules}

${resumeContext}
Target Job Details:
Company Name: ${companyLabel}
Hiring Manager: ${salutationName}
Job Description:
${(jd || '(Not provided — draft a compelling letter from the resume/profile alone, suitable for a general application.)').slice(0, 8000)}

Tone requested: ${tone || 'professional'} (adjust your writing style to be strictly ${tone || 'professional'}).
${enhanceBlock}
${userTasksBlock}

CRITICAL INSTRUCTIONS:
- Write the entire cover letter in well-formatted HTML suitable for a rich text editor.
- Use <p> tags for paragraphs. Do not use markdown wrappers like \`\`\`html.
- Do NOT include the applicant's contact header block or date at the top, just start with the salutation (e.g. "Dear ${salutationName},").
- Structure the cover letter with exactly 4 distinct paragraphs:
  1. The Hook: Direct statement connecting top technical strengths to a core challenge highlighted in the job description. No generic intro fluff (do not say "I am excited to apply" or similar).
  2. Core Evidence: 1-2 concrete, high-impact achievements from the experience data that directly solve requirements in the job description, emphasizing metrics.
  3. Strategic Alignment: Brief explanation of why this specific technical environment and target role fit current capabilities.
  4. Concise Call to Action: Direct closing.
- End with a professional sign-off and the applicant's name (${personalInfo.fullName || 'the applicant'}).
- Every achievement and detail must begin with or use strong, precise action verbs, and subjective buzzwords must be eliminated.
- Do not use brackets or placeholders (e.g., do not write [X%] or [X ms]). If quantitative metrics are not explicitly provided, estimate and insert realistic, technically-defensible metrics that logically align with the described achievements. Never invent fake companies or dates.
- Mirror exact technical keywords, tools, and terminology from the Job Description naturally.
- Ensure the tone matches the requested tone exactly.
- Keep the letter concise (about 250–350 words) so it fits on a single A4 page with a standard header.
- Output ONLY the HTML string. Do not include any other conversational text.`

  let lastError: unknown = null
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: careerExpertGenerateConfig({
          temperature: 0.7,
        }),
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
