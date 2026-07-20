import { GoogleGenAI } from '@google/genai'
import { withCredits } from '../../utils/withCredits'

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
  } = body

  if (!resumeData || !jobDescription || !companyName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Resume data, Job Description, and Company Name are required'
    })
  }

  const hasExistingDraft =
    typeof currentContent === 'string' &&
    currentContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 20

  const extraInstructions =
    typeof additionalInstructions === 'string' ? additionalInstructions.trim() : ''

  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey
  
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Gemini API key is missing'
    })
  }

  const ai = new GoogleGenAI({ apiKey })

  const enhanceBlock = hasExistingDraft
    ? `
MODE: AI ENHANCEMENT (not a blank rewrite from scratch).
Improve and tighten the applicant's existing draft below while preserving their voice and intent.
Keep structure unless clarity clearly benefits from light reorganization.
Existing draft HTML:
${currentContent}
`
    : `
MODE: Create a strong first draft from the resume + job details.
`

  const userTasksBlock = extraInstructions
    ? `
ADDITIONAL USER INSTRUCTIONS (must follow; these override length/style defaults when they conflict):
${extraInstructions}
`
    : ''

  const prompt = `You are an expert career coach and professional copywriter.
Your task is to produce a highly persuasive, customized cover letter for a job applicant.

Applicant Information (from their Resume):
Name: ${resumeData.personalInfo.fullName}
Job Title: ${resumeData.personalInfo.jobTitle || ''}
Email: ${resumeData.personalInfo.email}
Phone: ${resumeData.personalInfo.phone}
Location: ${resumeData.personalInfo.location}
Summary: ${resumeData.personalInfo.summary || ''}

Experiences:
${JSON.stringify(resumeData.experience, null, 2)}

Target Job Details:
Company Name: ${companyName}
Hiring Manager: ${hiringManager || 'Hiring Manager'}
Job Description:
${jobDescription}

Tone requested: ${tone} (adjust your writing style to be strictly ${tone}).
${enhanceBlock}
${userTasksBlock}

CRITICAL INSTRUCTIONS:
- Write the entire cover letter in well-formatted HTML suitable for a rich text editor.
- Use <p> tags for paragraphs. Do not use markdown wrappers like \`\`\`html.
- Do NOT include the applicant's contact header block or date at the top, just start with the salutation (e.g. "Dear ${hiringManager || 'Hiring Manager'},").
- End with a professional sign-off and the applicant's name.
- Highlight specific, relevant achievements from the applicant's experience that directly align with the Job Description.
- Ensure the tone matches the requested tone exactly.
- If the user asks to keep the letter to one page (or similar length limits), write a concise letter of about 250–350 words / 3–4 short paragraphs so it fits on a single A4 page with a standard header.
- Output ONLY the HTML string. Do not include any other conversational text.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7
      }
    })

    let text = response.text || ''
    if (text.startsWith('\`\`\`html')) {
      text = text.substring(7)
    } else if (text.startsWith('\`\`\`')) {
      text = text.substring(3)
    }
    if (text.endsWith('\`\`\`')) {
      text = text.substring(0, text.length - 3)
    }
    
    text = text.trim()

    return { content: text }
  } catch (error) {
    console.error('AI Cover Letter generation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate cover letter'
    })
  }
}, { reason: 'ai_cover_letter', requirePro: true })
