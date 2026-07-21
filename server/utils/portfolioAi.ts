import { createGeminiClient, generateWithModels, resolveGeminiModelChain } from './gemini'
import { careerExpertGenerateConfig } from './careerExpertPrompt'
import type { PortfolioProfileData, PortfolioProject } from '~/shared/types/portfolio'

/**
 * Parse a CV / cover-letter's raw text into structured portfolio data using the
 * project's native @google/genai client. All keys stay server-side.
 */

const SYSTEM_PROMPT = `You are a portfolio-building API. You receive the raw text of a CV or cover letter and return a single, strictly-valid JSON object describing a digital portfolio.

Return ONLY JSON (no markdown fences) matching exactly this shape:
{
  "full_name": string,
  "professional_bio": string,        // 2-4 sentence first-person summary
  "email": string,                   // if present in the document, else ""
  "phone": string,                   // if present, else ""
  "location": string,                // city/region if present, else ""
  "website": string,                 // personal site if present, else ""
  "linkedin": string,                // LinkedIn URL or handle if present, else ""
  "github": string,                  // GitHub URL or handle if present, else ""
  "formatted_projects": [            // real projects/roles from the document, most impressive first
    { "title": string, "description": string, "tech_stack": string[], "url": string }
  ],
  "core_skills": string[]            // 6-15 concise skills
}

Rules:
- Use only facts present in the document. Never invent employers, titles, metrics, or contact details.
- If a contact field is missing, use an empty string.
- If the name is unclear, use "Candidate".
- Never use em dashes; use commas.
- tech_stack must be an array of short strings (may be empty).
- url on projects may be empty when no link exists.`

function buildPrompt(documentText: string, jobDescription?: string): string {
  const jd = jobDescription?.trim()
  const jdBlock = jd
    ? `

Optional target job description — emphasize skills and projects that align with this role (still do not invent facts):
"""
${jd.slice(0, 8000)}
"""
`
    : ''

  return `${SYSTEM_PROMPT}
${jdBlock}
Build the portfolio JSON from the following document text:

"""
${documentText.slice(0, 24000)}
"""`
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim())
      } catch {
        /* fall through */
      }
    }
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw createError({ statusCode: 502, statusMessage: 'AI response was not valid JSON' })
  }
}

/** Coerce a loose AI object into a safe, fully-typed PortfolioProfileData. */
function normalizeProfileData(input: unknown): PortfolioProfileData {
  const obj = (input ?? {}) as Record<string, unknown>

  const projects: PortfolioProject[] = Array.isArray(obj.formatted_projects)
    ? obj.formatted_projects.slice(0, 12).map((p) => {
        const project = (p ?? {}) as Record<string, unknown>
        const url = String(project.url || '').trim()
        return {
          title: String(project.title || 'Untitled Project'),
          description: String(project.description || ''),
          tech_stack: Array.isArray(project.tech_stack)
            ? project.tech_stack.map(String).slice(0, 20)
            : [],
          ...(url ? { url } : {}),
        }
      })
    : []

  const optional = (key: string) => {
    const value = String(obj[key] || '').trim()
    return value || undefined
  }

  return {
    full_name: String(obj.full_name || 'Candidate'),
    professional_bio: String(obj.professional_bio || ''),
    formatted_projects: projects,
    core_skills: Array.isArray(obj.core_skills) ? obj.core_skills.map(String).slice(0, 20) : [],
    email: optional('email'),
    phone: optional('phone'),
    location: optional('location'),
    website: optional('website'),
    linkedin: optional('linkedin'),
    github: optional('github'),
  }
}

export async function generatePortfolioFromText(
  documentText: string,
  jobDescription?: string,
): Promise<PortfolioProfileData> {
  const ai = createGeminiClient()
  const models = resolveGeminiModelChain()

  const response = await generateWithModels(ai, models, (model) =>
    ai.models.generateContent({
      model,
      contents: buildPrompt(documentText, jobDescription),
      config: careerExpertGenerateConfig({
        temperature: 0.4,
        responseMimeType: 'application/json',
      }),
    }),
  )

  return normalizeProfileData(extractJsonObject(response.text || '{}'))
}
