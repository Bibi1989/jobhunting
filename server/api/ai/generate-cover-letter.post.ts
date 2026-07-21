import { createGeminiClient, resolveGeminiModelChain } from '../../utils/gemini'
import { withCareerExpertPrompt, careerExpertGenerateConfig } from '../../utils/careerExpertPrompt'
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
${currentContent}
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

  const rawResumeBlock =
    typeof rawResumeText === 'string' && rawResumeText.trim().length > 40
      ? `\nRaw resume text (use as additional grounding; do not invent facts):\n${rawResumeText.trim().slice(0, 12000)}\n`
      : ''

  const sourceNote = [
    resumeOk ? 'resume/profile details are available' : 'no detailed resume — write a strong generic-but-professional letter',
    jd ? 'a job description is available — tailor to it' : 'no job description — emphasize transferable strengths and interest in the role/company',
  ].join('; ')

  const prompt = withCareerExpertPrompt(`Your task is to produce a highly persuasive, customized cover letter for a job applicant.
Context: ${sourceNote}.

Applicant Information (from their Resume):
Name: ${personalInfo.fullName || 'Applicant'}
Job Title: ${personalInfo.jobTitle || ''}
Email: ${personalInfo.email || ''}
Phone: ${personalInfo.phone || ''}
Location: ${personalInfo.location || ''}
Summary: ${personalInfo.summary || ''}

Experiences:
${JSON.stringify(experiences, null, 2)}

Education:
${JSON.stringify(education, null, 2)}

Skills:
${JSON.stringify(skills, null, 2)}
${rawResumeBlock}
Target Job Details:
Company Name: ${companyLabel}
Hiring Manager: ${salutationName}
Job Description:
${jd || '(Not provided — draft a compelling letter from the resume/profile alone, suitable for a general application.)'}

Tone requested: ${tone || 'professional'} (adjust your writing style to be strictly ${tone || 'professional'}).
${enhanceBlock}
${userTasksBlock}

CRITICAL INSTRUCTIONS:
- Write the entire cover letter in well-formatted HTML suitable for a rich text editor.
- Use <p> tags for paragraphs. Do not use markdown wrappers like \`\`\`html.
- Do NOT include the applicant's contact header block or date at the top, just start with the salutation (e.g. "Dear ${salutationName},").
- End with a professional sign-off and the applicant's name (${personalInfo.fullName || 'the applicant'}).
- When a job description is present, highlight specific, relevant achievements that align with it.
- When only a resume is present, emphasize standout achievements and a clear value proposition.
- Never invent employers, degrees, or metrics that are not grounded in the provided resume/job text.
- Ensure the tone matches the requested tone exactly.
- If the user asks to keep the letter to one page (or similar length limits), write a concise letter of about 250–350 words / 3–4 short paragraphs so it fits on a single A4 page with a standard header.
- Output ONLY the HTML string. Do not include any other conversational text.`)

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
