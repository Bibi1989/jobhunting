import { createGeminiClient, resolveGeminiModel } from '../../utils/gemini'
import { formatGeminiError } from '../../utils/jobs'
import { withCredits } from '../../utils/withCredits'

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
  const { resumeData, rawResumeText } = body || {}

  if (!hasUsableResume(resumeData, rawResumeText)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please provide a valid resume or contact/experience details to analyze.',
    })
  }

  const ai = createGeminiClient()
  const models = [resolveGeminiModel()]

  const systemInstruction = `You are an expert Applicant Tracking System (ATS) parser and recruiter.
Your goal is to analyze the provided resume data and evaluate its compatibility with standard ATS software.

Base your score on:
- Presence of clear formatting, standard sections (Experience, Education).
- Use of strong action verbs and quantified impact.
- Likely parseability by software.
- General professional quality.

Provide 2-3 specific strengths and 2-4 specific areas for improvement based on the text.
`

  let contentToAnalyze = ''
  if (resumeData) {
    contentToAnalyze += `Structured Resume Data:\n${JSON.stringify(resumeData, null, 2)}\n\n`
  }
  if (rawResumeText) {
    contentToAnalyze += `Raw Extracted Text:\n${rawResumeText}`
  }

  let result;
  let lastError: any;
  for (const model of models) {
    try {
      result = await ai.models.generateContent({
        model,
        contents: contentToAnalyze,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              score: { type: 'number', description: 'Score between 0 and 100' },
              strengths: { type: 'array', items: { type: 'string' }, description: 'Specific strengths found' },
              improvements: { type: 'array', items: { type: 'string' }, description: 'Areas for improvement' }
            },
            required: ['score', 'strengths', 'improvements']
          }
        }
      });
      break; // Success
    } catch (err) {
      lastError = err;
      if (!isGeminiQuotaOrUnavailableError(err)) {
        break; // Don't retry if it's a structural error (like bad request)
      }
    }
  }

  if (!result) {
    throw formatGeminiError(lastError || new Error('All AI models failed or were unavailable.'));
  }

  const text = result.text;
  if (!text) {
    throw new Error('Empty response from AI')
  }

  try {
    const parsed = JSON.parse(text)
    return { success: true, analysis: parsed }
  } catch (parseErr) {
    console.error('Failed to parse ATS response JSON:', text)
    throw new Error('AI returned invalid format.')
  }
})
