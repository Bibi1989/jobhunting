import { createGeminiClient, resolveGeminiModel } from '../../utils/gemini'
import { withCareerExpertPrompt, careerExpertGenerateConfig } from '../../utils/careerExpertPrompt'
import { requireUser } from '~/server/utils/auth'

export type CaseStudyAnalysis = {
  score: number
  breakdown: {
    problem: number
    action: number
    results: number
    tech: number
    clarity: number
  }
  improvements: string[]
  suggestedRewrite: string
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ title: string; description: string; tech_stack?: string[] }>(event)
  const { title, description, tech_stack = [] } = body || {}

  if (!title || !description) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project title and description are required for case study analysis',
    })
  }

  const ai = createGeminiClient()
  const model = resolveGeminiModel()

  const prompt = withCareerExpertPrompt(`You are an elite portfolio reviewer and case study design strategist. Analyze this project for "case study completeness" to assess how well it demonstrates engineering excellence to hiring managers.

Project Details:
- Title: ${title}
- Tech Stack: ${tech_stack.join(', ') || 'None specified'}
- Current Description:
"""
${description}
"""

Evaluate the case study description based on these 5 dimensions (each scored 0-100):
1. **Problem**: Did the candidate explain what the challenge/pain-point was and why it needed to be solved?
2. **Action**: Did they explain how they solved it, their specific decisions, architecture, and engineering efforts?
3. **Results/Metrics**: Are there concrete outcomes, benchmarks, scalability figures, or savings?
4. **Tech Specificity**: Are the tech tools integrated naturally into the engineering actions (not just a bulleted list at the bottom)?
5. **Clarity**: Is it concise, professionally written, and engaging?

Provide a list of 2-4 highly actionable improvements (targeted improvements).
Provide a "suggestedRewrite" of the description that incorporates the feedback and meets the Google XYZ bullet format where applicable, maintaining technical truthfulness.

Return ONLY valid JSON matching this schema (no markdown fences):
{
  "score": number, // Overall weighted average score (0-100)
  "breakdown": {
    "problem": number, // 0-100
    "action": number, // 0-100
    "results": number, // 0-100
    "tech": number, // 0-100
    "clarity": number // 0-100
  },
  "improvements": string[],
  "suggestedRewrite": string
}`)

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: careerExpertGenerateConfig({
        temperature: 0.35,
        responseMimeType: 'application/json',
      }),
    })

    const raw = (response.text || '').trim()
    const parsed = JSON.parse(raw) as CaseStudyAnalysis

    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      breakdown: {
        problem: Math.max(0, Math.min(100, Number(parsed.breakdown?.problem) || 0)),
        action: Math.max(0, Math.min(100, Number(parsed.breakdown?.action) || 0)),
        results: Math.max(0, Math.min(100, Number(parsed.breakdown?.results) || 0)),
        tech: Math.max(0, Math.min(100, Number(parsed.breakdown?.tech) || 0)),
        clarity: Math.max(0, Math.min(100, Number(parsed.breakdown?.clarity) || 0)),
      },
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
      suggestedRewrite: String(parsed.suggestedRewrite || ''),
    }
  } catch (error: unknown) {
    console.error('Case study analysis error:', error)
    const message = error instanceof Error ? error.message : 'Failed to analyze project case study'
    throw createError({
      statusCode: 500,
      statusMessage: message,
    })
  }
})
