import { createGeminiClient, resolveGeminiParsekitModel } from '../../utils/gemini'
import {
  careerExpertGenerateConfig,
  metricsGuidance,
  resolveUseMetrics,
} from '../../utils/careerExpertPrompt'
import { withCredits } from '../../utils/withCredits'

export default withCredits(async (event) => {
  const body = await readBody(event)
  const { title, currentDescription, type, experiences, targetRole, commandPrompt, projectDescription } = body
  const useMetrics = resolveUseMetrics(body?.useMetrics)

  if (!title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title is required for enhancement',
    })
  }

  const ai = createGeminiClient()
  const model = resolveGeminiParsekitModel()
  const metricsLine = metricsGuidance(useMetrics)

  let task = ''
  if (type === 'summary') {
    let experienceContext = ''
    if (experiences && experiences.length > 0) {
      experienceContext =
        `\n\nUser's past experiences to consider:\n` +
        experiences.map((exp: { title?: string; company?: string }) => `- ${exp.title} at ${exp.company}`).join('\n')
    }

    let roleTargetText = ''
    if (targetRole && targetRole.trim()) {
      roleTargetText = `\nTarget Role focus/details to align with: "${targetRole.trim()}"`
    }

    let commandPromptText = ''
    if (commandPrompt && commandPrompt.trim()) {
      commandPromptText = `\nAdditional style/content instructions from user: "${commandPrompt.trim()}"`
    }

    task = `The user is writing a professional summary. The target role/job title is "${title}".${roleTargetText}${commandPromptText}
Current summary text (if any) (may contain HTML):
"""
${currentDescription || ''}
"""${experienceContext}

Instructions:
- If the current summary is empty, generate a highly professional, 2-3 sentence summary tailored for a "${title}" role.${targetRole ? ` Align it with the target role details: "${targetRole}".` : ''}
- If the current summary is present, enhance it to be more professional, impactful, and concise.${targetRole ? ` Tailor it to align with the target role details: "${targetRole}".` : ''}
- Use the provided past experiences to highlight relevant achievements if appropriate.
- ${metricsLine}
- ${commandPrompt ? `Follow the user's instructions: "${commandPrompt}".\n` : ''}- DO NOT use markdown. ALWAYS format your response as valid HTML using <p>, <strong>, <em>, etc.
- Do NOT add inline styles, background colors, or text colors.
- Return ONLY the raw HTML string without any markdown code blocks.`
  } else if (type === 'experience') {
    let roleTargetText = ''
    if (targetRole && targetRole.trim()) {
      roleTargetText = `\nTarget Role focus/details to align with: "${targetRole.trim()}"`
    }

    let commandPromptText = ''
    if (commandPrompt && commandPrompt.trim()) {
      commandPromptText = `\nAdditional style/content instructions from user: "${commandPrompt.trim()}"`
    }

    const focusLine = useMetrics
      ? '- Focus on accomplishments and metrics rather than just duties.'
      : '- Focus on accomplishments and concrete scope rather than just duties. Do not invent quantitative metrics.'

    task = `The user is writing the description for an experience entry with the title "${title}".${roleTargetText}${commandPromptText}
Current description text (if any) (may contain HTML):
"""
${currentDescription || ''}
"""

Instructions:
- If the current description is empty, generate 3-4 professional, impactful bullet points for a typical "${title}" role.${targetRole ? ` Align them with the target role details: "${targetRole}".` : ''}
- If the current description is present, enhance it to be more professional, action-oriented, and impactful, keeping it as a bulleted list.${targetRole ? ` Align it with the target role details: "${targetRole}".` : ''}
${focusLine}
- ${metricsLine}
- ${commandPrompt ? `Follow the user's additional guidelines: "${commandPrompt}".\n` : ''}- DO NOT use markdown. ALWAYS format your response as valid HTML using <ul> and <li> only for lists. Do NOT put bullet characters (•, -, *) inside the <li> text — the list tags provide the bullets.
- Do NOT add inline styles, background colors, or text colors.
- Return ONLY the raw HTML string without any markdown code blocks.`
  } else if (type === 'project') {
    let roleTargetText = ''
    if (targetRole && targetRole.trim()) {
      roleTargetText = `\nTarget Role focus/details to align with: "${targetRole.trim()}"`
    }

    let commandPromptText = ''
    if (commandPrompt && commandPrompt.trim()) {
      commandPromptText = `\nAdditional style/content instructions from user: "${commandPrompt.trim()}"`
    }

    let projectDescriptionText = ''
    if (projectDescription && projectDescription.trim()) {
      projectDescriptionText = `\nProject description/notes provided by user: "${projectDescription.trim()}"`
    }

    const emptyBullets = useMetrics
      ? 'generate 2-3 professional, metric-oriented bullet points describing what the project entails'
      : 'generate 2-3 professional bullet points describing what the project entails (no invented metrics)'

    task = `The user is writing the description for a project entry with the title "${title}".${roleTargetText}${commandPromptText}${projectDescriptionText}
Current description text (if any) (may contain HTML):
"""
${currentDescription || ''}
"""

Instructions:
- If the current description is empty, ${emptyBullets}. Use the provided project description/notes ("${projectDescription || ''}") as context.
- If the current description is present, enhance it to be more professional, impact-oriented, and structured, focusing on the technologies used and results achieved. Integrate the project notes ("${projectDescription || ''}") if provided.
- ${metricsLine}
- ${commandPrompt ? `Follow the user's additional guidelines: "${commandPrompt}".\n` : ''}- DO NOT use markdown. ALWAYS format your response as valid HTML using <ul> and <li> only for lists. Do NOT put bullet characters (•, -, *) inside the <li> text.
- Do NOT add inline styles, background colors, or text colors.
- Return ONLY the raw HTML string without any markdown code blocks.`
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Unknown enhancement type' })
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: task,
      config: careerExpertGenerateConfig(
        {
          temperature: 0.7,
        },
        { useMetrics },
      ),
    })

    const text = (response.text?.trim() || '')
      .replace(/^```(?:html)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    return {
      enhancedDescription: text,
    }
  } catch (error: unknown) {
    console.error('Enhance description error:', error)
    const message = error instanceof Error ? error.message : 'Failed to enhance description'
    throw createError({ statusCode: 500, statusMessage: message })
  }
}, { reason: 'ai_enhance', requirePro: true })
