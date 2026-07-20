import { createGeminiClient } from '../../utils/gemini'
import { withCredits } from '../../utils/withCredits'

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
}

export default withCredits(async (event) => {
  const body = await readBody(event)
  const { resumeData, coverLetter, targetLanguage, mode } = body

  if (!targetLanguage || (!resumeData && !coverLetter)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content and target language are required',
    })
  }

  const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage

  const ai = createGeminiClient()
  const payload = mode === 'cover_letter' ? coverLetter : resumeData

  const prompt = `You are an expert translator. I will provide you with a JSON object representing a ${
    mode === 'cover_letter' ? 'cover letter document' : 'resume'
  }.
Your task is to translate ALL user-entered string values (like names, job titles, summaries, descriptions, letter body, company names when appropriate, etc.) into ${langName}.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY valid JSON.
- DO NOT translate the JSON keys.
- DO NOT add or remove any fields.
- PRESERVE any HTML formatting inside the strings (e.g., <ul>, <li>, <p>).
- Keep email addresses, phone numbers, URLs, and dates/ISO month values unchanged unless they contain prose.
- Return the JSON directly, without markdown blocks.

Here is the JSON:
${JSON.stringify(payload, null, 2)}
`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    })

    let text = String(response.text || '').trim()
    if (text.startsWith('```json')) text = text.slice(7)
    else if (text.startsWith('```')) text = text.slice(3)
    if (text.endsWith('```')) text = text.slice(0, -3)
    text = text.trim()

    const translatedData = JSON.parse(text)
    return { translatedData }
  } catch (error) {
    console.error('AI Translation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to translate document',
    })
  }
}, { reason: 'ai_translate', requirePro: true })
