import { GoogleGenAI, Type } from '@google/genai'
import type { Job, TailoredMaterials } from '../../shared/types/job'
import {
  PROFESSIONAL_COVER_LETTER_STRUCTURE,
  PROFESSIONAL_RESUME_STRUCTURE,
  buildProfessionalCoverLetterSample,
  buildProfessionalResumeSample,
  replaceEmDashes,
} from '../../shared/samples/professionalDocuments'
import { getCvFormat } from '../../shared/samples/cvFormats'
import {
  enforceExperienceBullets,
  stampCandidateIdentity,
  hasUsableIdentity,
  type CandidateProfile,
} from '../../shared/samples/candidateProfile'
import { isGeminiQuotaOrUnavailableError, ollamaJsonPrompt } from './aiFallback'
import { resolveCandidateProfileSync } from './candidateProfile'
import { formatGeminiError, normalizeJobs } from './jobs'

export type JobScrapeTarget = {
  jobTitle?: string
  resumeText?: string
  coverLetterText?: string
}

export function hasScrapeTarget(target?: JobScrapeTarget | null): boolean {
  if (!target) return false
  return Boolean(
    target.jobTitle?.trim() ||
      target.resumeText?.trim() ||
      target.coverLetterText?.trim(),
  )
}

export function buildScrapeTargetPrompt(target?: JobScrapeTarget | null): string {
  if (!hasScrapeTarget(target)) return ''

  const parts: string[] = []
  if (target!.jobTitle?.trim()) {
    parts.push(
      `Primary target job title / role: "${target!.jobTitle.trim()}". Prefer openings that match or closely relate to this title (same function, seniority band, and stack).`,
    )
  }
  if (target!.resumeText?.trim()) {
    parts.push(
      `Candidate resume (match seniority, skills, and domain; when no explicit title is given, infer the target role from the resume headline/summary):\n${target!.resumeText.trim().slice(0, 6000)}`,
    )
  }
  if (target!.coverLetterText?.trim()) {
    parts.push(
      `Cover letter signals (role/industry intent):\n${target!.coverLetterText.trim().slice(0, 3000)}`,
    )
  }

  return `

CANDIDATE TARGETING — return openings related to the candidate's target role first.
When a target job title is present, strongly prioritize jobs with similar titles and responsibilities.
Prefer strongly related roles; still include borderline matches if few related roles exist, but deprioritize clearly unrelated titles (e.g. sales-only when the candidate is engineering).
${parts.join('\n\n')}`
}

const JOB_ARRAY_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      company: { type: Type.STRING },
      location: { type: Type.STRING },
      salaryMin: { type: Type.NUMBER },
      salaryMax: { type: Type.NUMBER },
      currency: { type: Type.STRING },
      url: { type: Type.STRING },
      description: {
        type: Type.STRING,
        description:
          'Full job description text from the page when available (responsibilities, requirements, benefits). Prefer the complete posting over a short summary.',
      },
    },
    required: ['title', 'location', 'url'],
  },
} as const

const TAILORED_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    resume: {
      type: Type.STRING,
      description:
        'Complete tailored resume in Markdown with EVERY work role and EVERY project from the source resume.',
    },
    coverLetter: {
      type: Type.STRING,
      description: 'Tailored cover letter in Markdown grounded in specific roles/projects from the source.',
    },
  },
  required: ['resume', 'coverLetter'],
} as const

export function resolveGeminiApiKey(): string {
  // Secrets must come from env at request time — never bake keys into nuxt.config.
  const fromEnv =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.NUXT_GEMINI_API_KEY?.trim() ||
    ''
  if (fromEnv) return fromEnv
  try {
    return String(useRuntimeConfig().geminiApiKey || '').trim()
  } catch {
    return ''
  }
}

export function resolveGeminiModel(): string {
  // Prefer GEMINI_MODEL from .env / Netlify; do not prefer weaker flash models first.
  const fromEnv =
    process.env.GEMINI_MODEL?.trim() ||
    process.env.NUXT_GEMINI_MODEL?.trim() ||
    ''
  if (fromEnv) return fromEnv
  try {
    return String(useRuntimeConfig().geminiModel || '').trim() || 'gemini-3.1-pro-preview'
  } catch {
    return 'gemini-3.1-pro-preview'
  }
}

/**
 * Faster/cheaper model for parse, ATS check, email, enhance, analyze.
 * Set GEMINI_MODEL_PARSEKIT (or NUXT_GEMINI_MODEL_PARSEKIT).
 * Defaults to flash — never silently upgrades to Pro (that burns tokens).
 */
export function resolveGeminiParsekitModel(): string {
  const fromEnv =
    process.env.GEMINI_MODEL_PARSEKIT?.trim() ||
    process.env.NUXT_GEMINI_MODEL_PARSEKIT?.trim() ||
    ''
  if (fromEnv) return fromEnv
  try {
    const fromConfig = String(useRuntimeConfig().geminiModelParsekit || '').trim()
    if (fromConfig) return fromConfig
  } catch {
    /* no runtime config */
  }
  return 'gemini-2.5-flash'
}

/**
 * Short Pro→Flash chain for expensive drafts (resume / cover letter / portfolio / ATS fix).
 * Avoids long fallback lists that can bill multiple full completions.
 */
export function resolveGeminiModelChain(extraFallbacks: string[] = []): string[] {
  const primary = resolveGeminiModel()
  const flash = resolveGeminiParsekitModel()
  const chain = [primary, ...extraFallbacks, flash]
  return [...new Set(chain.map((m) => String(m || '').trim()).filter(Boolean))]
}

/** Flash-only try order for cheap structured / short-text tasks. */
export function resolveGeminiParsekitModelChain(extraFallbacks: string[] = []): string[] {
  const primary = resolveGeminiParsekitModel()
  const chain = [primary, ...extraFallbacks, 'gemini-2.5-flash', 'gemini-2.0-flash']
  return [...new Set(chain.map((m) => String(m || '').trim()).filter(Boolean))]
}

export function createGeminiClient(apiKey?: string) {
  const key = (apiKey?.trim() || resolveGeminiApiKey()).trim()
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GEMINI_API_KEY is missing. Add it to .env and restart the server.',
    })
  }

  if (key.startsWith('ya29.')) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'GEMINI_API_KEY appears to be an OAuth access token. Use an AI Studio API key instead.',
    })
  }

  return new GoogleGenAI({ apiKey: key })
}

export async function generateWithModels<T>(
  ai: GoogleGenAI,
  models: string[],
  generate: (model: string) => Promise<T>,
  ollamaFallback?: () => Promise<unknown>,
): Promise<T> {
  let lastError: unknown
  let sawQuota = false

  for (const model of models) {
    try {
      return await generate(model)
    } catch (error) {
      lastError = error
      const message = formatGeminiError(error)
      console.warn(`Gemini model ${model} failed:`, message)
      if (isGeminiQuotaOrUnavailableError(error)) {
        sawQuota = true
      }
    }
  }

  if (ollamaFallback && (sawQuota || lastError)) {
    console.warn('Gemini unavailable/quota exceeded — using configured fallback')
    try {
      return (await ollamaFallback()) as T
    } catch (ollamaError) {
      console.warn('Ollama fallback failed:', ollamaError)
      throw createError({
        statusCode: 503,
        statusMessage: `${formatGeminiError(lastError)} Ollama fallback also failed: ${
          ollamaError instanceof Error ? ollamaError.message : String(ollamaError)
        }`,
      })
    }
  }

  throw createError({
    statusCode: 503,
    statusMessage: formatGeminiError(lastError),
  })
}

export async function extractJobsFromHtml(
  ai: GoogleGenAI,
  models: string[],
  html: string,
  url: string,
  target?: JobScrapeTarget | null,
): Promise<Job[]> {
  const targeting = buildScrapeTargetPrompt(target)
  const response = await generateWithModels(
    ai,
    models,
    (model) =>
      ai.models.generateContent({
        model,
        contents: `You are a job extraction API. Extract job postings from the following HTML.
Return roles with title, location, and application URL.
The source URL is ${url}.
${targeting || 'Return every role you can find.'}

HTML:
${html}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: JOB_ARRAY_SCHEMA,
        },
      }),
    async () => {
      const parsed = await ollamaJsonPrompt<{ jobs?: unknown } | unknown[]>({
        system:
          'Extract job postings from HTML. Return JSON as {"jobs":[...]} where each job has title, location, url, and optional company, salaryMin, salaryMax, currency, description. Prefer roles matching any candidate targeting instructions.',
        user: `Source URL: ${url}${targeting}\n\nHTML:\n${html.slice(0, 50000)}`,
      })
      const jobs = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { jobs?: unknown }).jobs)
          ? (parsed as { jobs: unknown[] }).jobs
          : []
      return { text: JSON.stringify(jobs) }
    },
  )

  return normalizeJobs(parseJsonArray(response.text || '[]'), url)
}

export async function searchJobsForUrl(
  ai: GoogleGenAI,
  models: string[],
  url: string,
  reason: string,
  target?: JobScrapeTarget | null,
): Promise<Job[]> {
  const targeting = buildScrapeTargetPrompt(target)
  const response = await generateWithModels(
    ai,
    models,
    (model) =>
      ai.models.generateContent({
        model,
        contents: `You are a job extraction API. We could not extract jobs from the source page (${reason}).
Use Google Search to find current job postings for the company or careers page associated with: ${url}
${targeting}

Return ONLY a valid JSON array. Each item must include: title, location, url, and optionally company, salaryMin, salaryMax, currency (prefer EUR/€ when European), description.
Do not wrap the JSON in markdown fences.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      }),
    async () => {
      const parsed = await ollamaJsonPrompt<{ jobs?: unknown } | unknown[]>({
        system:
          'Infer likely current job openings for a company from the careers URL and your knowledge. Return JSON {"jobs":[{"title","location","url","company","description"}]}. Prefer roles matching any candidate targeting. If unsure, return an empty jobs array.',
        user: `Careers URL: ${url}\nReason page failed: ${reason}${targeting}\nReturn up to 10 plausible openings with absolute application URLs when possible.`,
      })
      const jobs = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { jobs?: unknown }).jobs)
          ? (parsed as { jobs: unknown[] }).jobs
          : []
      return { text: JSON.stringify(jobs) }
    },
  )

  return normalizeJobs(parseJsonArray(response.text || '[]'), url)
}

/**
 * When targeting is set, keep jobs that are at least somewhat related.
 * Falls back to the original list if filtering would drop everything.
 */
export async function filterJobsByTarget(
  ai: GoogleGenAI,
  models: string[],
  jobs: Job[],
  target?: JobScrapeTarget | null,
): Promise<Job[]> {
  if (!hasScrapeTarget(target) || jobs.length === 0) return jobs
  if (jobs.length <= 2) return jobs

  const targeting = buildScrapeTargetPrompt(target)
  const catalog = jobs
    .map(
      (j, i) =>
        `${i}. ${j.title} | ${j.company || 'Unknown'} | ${j.location} | ${(j.description || '').slice(0, 280)}`,
    )
    .join('\n')

  try {
    const response = await generateWithModels(
      ai,
      models,
      (model) =>
        ai.models.generateContent({
          model,
          contents: `You filter job listings for relevance to a candidate.
${targeting}

Return JSON: {"indexes":[number,...]} — 0-based indexes of RELATED jobs from the list below, best matches first.
Include a role if it is a reasonable fit for skills/seniority/domain or the target title. Exclude clearly unrelated roles.
If almost everything is unrelated, still return the closest 1–3 indexes.

Jobs:
${catalog}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                indexes: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
              },
              required: ['indexes'],
            },
          },
        }),
      async () => {
        const parsed = await ollamaJsonPrompt<{ indexes?: number[] }>({
          system:
            'Filter job list indexes for candidate relevance. Return JSON {"indexes":[0,2,...]} best first.',
          user: `${targeting}\n\nJobs:\n${catalog}`,
        })
        return { text: JSON.stringify(parsed) }
      },
    )

    const parsed = JSON.parse(response.text || '{}') as { indexes?: unknown }
    const indexes = Array.isArray(parsed.indexes)
      ? parsed.indexes
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n >= 0 && n < jobs.length)
      : []

    const unique = [...new Set(indexes)]
    if (unique.length === 0) return jobs
    return unique.map((i) => jobs[i]!).filter(Boolean)
  } catch (error) {
    console.warn('Job relevance filter failed — returning unfiltered list:', formatGeminiError(error))
    return jobs
  }
}

export async function tailorApplicationMaterials(
  ai: GoogleGenAI,
  models: string[],
  job: Job,
  resumeText?: string,
  coverLetterText?: string,
  cvFormatId?: string,
  candidateProfile?: CandidateProfile | null,
  tailoringPreset?: 'ats-first' | 'impact-first' | 'leadership' | 'tech-expert',
): Promise<TailoredMaterials> {
  const format = getCvFormat(cvFormatId)
  const profile = resolveCandidateProfileSync({
    resumeText,
    candidateProfile,
  })

  const identityBlock = hasUsableIdentity(profile)
    ? `Use this identity exactly:
Name: ${profile.fullName}
Email: ${profile.email}
Phone: ${profile.phone}
Location: ${profile.location}
LinkedIn: ${profile.linkedin || ''}
Website: ${profile.website || ''}
Resume H1 and cover-letter signature MUST be "${profile.fullName}". Never use Jordan Ellis or other sample names.`
    : 'Copy name, email, phone, and location exactly from the uploaded resume. Never invent sample contact details.'

  let presetRules = ''
  if (tailoringPreset === 'ats-first') {
    presetRules = `
- PERSONALITY PRESET: ATS-First. Focus on maximum keyword alignment with the job description. Rewrite experience and summary sentences using exact matching terminology. Maintain a highly direct, standard style. Keep achievements objective and grounded in specific keywords.`
  } else if (tailoringPreset === 'impact-first') {
    presetRules = `
- PERSONALITY PRESET: Impact/Metrics-First. Emphasize numeric results, scale, speedups, and business outcomes. Use the Google XYZ structure for experience bullets: "Accomplished [X], as measured by [Y], by doing [Z]". Every single role MUST highlight a quantifiable achievement.`
  } else if (tailoringPreset === 'leadership') {
    presetRules = `
- PERSONALITY PRESET: Leadership. Showcase mentoring, project management, technical design ownership, stakeholder coordination, and cross-functional leadership. Frame achievements in terms of team coordination, code review stewardship, or roadmap influence.`
  } else if (tailoringPreset === 'tech-expert') {
    presetRules = `
- PERSONALITY PRESET: Tech Expert. Deepen technical descriptions. Highlight specific libraries, frameworks, architecture paradigms, database query plans, API structures, or performance optimization techniques. Emphasize tech stack implementation details.`
  }

  const prompt = `Write a tailored resume and cover letter in Markdown JSON {"resume":"...","coverLetter":"..."}.

CV format: ${format.name} — ${format.description}
${identityBlock}

Rules:
- Never use em dashes; use commas.
- Include EVERY work experience role and EVERY project from the source resume. Do not omit older jobs or projects.
- Add a ## Projects section when projects exist in the source.
- Work experience MUST use "-" bullet points (3–6 per role). Never paragraph experience.
- Cover letter: 4–5 short paragraphs grounded in specific roles/projects, signed with the real name.
- Do not invent employers, degrees, or skills not in the source materials.
- Keep formatting clean and presentable (clear headings, bullets, short lines).${presetRules}

Resume outline:
${PROFESSIONAL_RESUME_STRUCTURE}

Cover letter outline:
${PROFESSIONAL_COVER_LETTER_STRUCTURE}

Job:
Title: ${job.title}
Company: ${job.company || 'Unknown'}
Location: ${job.location || 'Unknown'}
Description:
${(job.description || 'Not provided').slice(0, 8000)}

${
  resumeText
    ? `Candidate resume (source of truth — preserve ALL roles and projects):\n${resumeText.slice(0, 28000)}`
    : hasUsableIdentity(profile)
      ? `Candidate profile JSON:\n${JSON.stringify(profile).slice(0, 8000)}`
      : 'No resume provided — use clear [PLACEHOLDERS] for missing facts.'
}

${
  coverLetterText
    ? `Existing cover letter to adapt:\n${coverLetterText.slice(0, 8000)}`
    : 'Write a new cover letter.'
}`

  try {
    const response = await generateWithModels(ai, models.slice(0, 2), (model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: TAILORED_SCHEMA,
          temperature: 0.4,
        },
      }),
    )

    const parsed = JSON.parse(response.text || '{}') as TailoredMaterials
    return finalizeTailored(parsed, profile)
  } catch (error) {
    console.warn('Gemini tailor failed — using deterministic profile template:', formatGeminiError(error))
    return buildDeterministicTailored(job, format.id, profile, resumeText)
  }
}

function finalizeTailored(
  parsed: TailoredMaterials,
  profile: CandidateProfile,
): TailoredMaterials {
  return {
    resume: stampCandidateIdentity(
      enforceExperienceBullets(replaceEmDashes(parsed.resume || '')),
      profile,
    ),
    coverLetter: stampCandidateIdentity(replaceEmDashes(parsed.coverLetter || ''), profile),
  }
}

/** Non-LLM fallback that always uses the candidate's real details. */
export function buildDeterministicTailored(
  job: Job,
  formatId: string,
  profile: CandidateProfile,
  resumeText?: string,
): TailoredMaterials {
  const analysis = {
    title: job.title,
    company: job.company || 'Hiring Company',
    keywords: [] as string[],
    requiredSkills: profile.skills.slice(0, 8),
    preferredSkills: [] as string[],
    responsibilities: profile.experiences[0]?.bullets?.slice(0, 4) || [],
    tone: 'professional',
    seniority: 'mid-level',
  }

  const safeProfile: CandidateProfile = {
    ...profile,
    fullName:
      profile.fullName ||
      resumeText
        ?.split(/\n/)
        .map((l) => l.replace(/^#+\s*/, '').trim())
        .find((l) => l.length > 2 && !/@/.test(l))
        ?.split(/[|·]/)[0]
        .trim() ||
      'Candidate',
  }

  const resume = stampCandidateIdentity(
    enforceExperienceBullets(
      replaceEmDashes(buildProfessionalResumeSample(analysis, formatId, safeProfile)),
    ),
    safeProfile,
  )
  const coverLetter = stampCandidateIdentity(
    replaceEmDashes(buildProfessionalCoverLetterSample(analysis, formatId, safeProfile)),
    safeProfile,
  )

  return { resume, coverLetter }
}

function parseJsonArray(text: string): unknown[] {
  const trimmed = text.trim()

  try {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced?.[1]) {
      try {
        const parsed = JSON.parse(fenced[1].trim())
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    const start = trimmed.indexOf('[')
    const end = trimmed.lastIndexOf(']')
    if (start !== -1 && end > start) {
      try {
        const parsed = JSON.parse(trimmed.slice(start, end + 1))
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    return []
  }
}
