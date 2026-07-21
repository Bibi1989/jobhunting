import { GoogleGenAI, Type } from '@google/genai'
import {
  buildProfessionalCoverLetterSample,
  buildProfessionalResumeSample,
  replaceEmDashes,
} from '../../shared/samples/professionalDocuments'
import {
  enforceExperienceBullets,
  stampCandidateIdentity,
  type CandidateProfile,
} from '../../shared/samples/candidateProfile'
import { formatGeminiError } from './jobs'
import { resolveGeminiApiKey, resolveGeminiModel } from './gemini'

export function getDocumentAiModel(): string {
  return resolveGeminiModel()
}

export interface DocumentPair {
  resume: string
  coverLetter: string
}

export interface JobSignals {
  title: string
  company: string
  requiredSkills: string[]
  preferredSkills: string[]
  keywords: string[]
  responsibilities: string[]
  seniority: string
  tone: string
}

const DOCUMENTS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    resume: {
      type: Type.STRING,
      description:
        'Complete tailored resume in Markdown including ALL work roles and ALL projects from the source',
    },
    coverLetter: {
      type: Type.STRING,
      description: 'Tailored cover letter in Markdown grounded in the source resume',
    },
  },
  required: ['resume', 'coverLetter'],
} as const

const JOB_SIGNALS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    company: { type: Type.STRING },
    requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    preferredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
    seniority: { type: Type.STRING },
    tone: { type: Type.STRING },
  },
  required: ['title', 'requiredSkills', 'keywords', 'responsibilities'],
} as const

export function createDocumentAiClient(apiKey?: string): GoogleGenAI {
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

/**
 * Scenario A: PDF resume (+ optional cover letter PDF) + job description → gemini-3.1-pro-preview
 */
export async function generateFromPdfResume(input: {
  ai: GoogleGenAI
  jobDescription: string
  pdfBuffer: Buffer
  coverLetterPdfBuffer?: Buffer | null
}): Promise<DocumentPair> {
  const prompt = `You are an expert resume and cover-letter writer.

Compare the attached PDF resume${input.coverLetterPdfBuffer ? ' and cover letter PDF' : ''} with the target job description.
Produce a RICH, complete Markdown resume and a tailored Markdown cover letter.

CRITICAL completeness rules (do not skip):
- Include EVERY work experience / employment role from the source resume. Do not drop older jobs.
- Include EVERY project from the source resume (create a ## Projects section if any projects exist).
- Keep education, certifications, skills, languages, and awards from the source.
- Reorder or rephrase bullets to match the job, but do not omit roles or projects.
- For each role: keep company, title, dates/location, and 3–6 Markdown bullets starting with "- ".
- For each project: name + 2–4 bullets of what was built and impact.
- Preserve the candidate's real name, email, phone, location, LinkedIn from the PDF. Never invent sample names.
- Cover letter: 4–5 human paragraphs grounded in specific roles/projects from the resume. Avoid robotic AI words (delve, testament, leverage, passionate, synergy, cutting-edge, thrilled, seamlessly).
- Never use em dashes; use commas.
- Do not fabricate employers, degrees, or metrics not supported by the source.
- Return JSON only with keys resume and coverLetter.

Target job description:
${input.jobDescription.slice(0, 14000)}`

  const contents: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: input.pdfBuffer.toString('base64'),
        },
      },
    ]

  if (input.coverLetterPdfBuffer?.length) {
    contents.push({
      text: 'Additional source: the candidate\'s existing cover letter PDF (adapt tone and reuse truthful claims; do not invent).',
    })
    contents.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: input.coverLetterPdfBuffer.toString('base64'),
      },
    })
  }

  try {
    const response = await input.ai.models.generateContent({
      model: getDocumentAiModel(),
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: DOCUMENTS_SCHEMA,
        temperature: 0.3,
        maxOutputTokens: 16384,
      },
    })

    return parseDocumentPair(response.text || '{}')
  } catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage: `PDF document generation failed: ${formatGeminiError(error)}`,
    })
  }
}

/**
 * Scenario B: no resume → flash-lite extracts JD signals, then templates are filled.
 */
export async function generateFromJobDescriptionOnly(input: {
  ai: GoogleGenAI
  jobDescription: string
}): Promise<DocumentPair> {
  let signals: JobSignals

  try {
    const response = await input.ai.models.generateContent({
      model: getDocumentAiModel(),
      contents: `Analyze this job description. Return JSON with:
title, company, requiredSkills (array), preferredSkills (array), keywords (array),
responsibilities (array of concrete duties), seniority, tone.

Job description:
${input.jobDescription.slice(0, 12000)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: JOB_SIGNALS_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    })

    signals = normalizeSignals(JSON.parse(response.text || '{}'))
  } catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage: `Job analysis failed: ${formatGeminiError(error)}`,
    })
  }

  const placeholderProfile: CandidateProfile = {
    fullName: '[Your Full Name]',
    email: '[your.email@example.com]',
    phone: '[Your Phone]',
    location: '[City, Country]',
    linkedin: '[linkedin.com/in/you]',
    website: '',
    summary: '',
    skills: unique([
      ...signals.requiredSkills,
      ...signals.preferredSkills,
      ...signals.keywords,
    ]).slice(0, 12),
    experiences: [
      {
        company: '[Most Recent Company]',
        title: signals.title || '[Your Title]',
        location: '[City]',
        startDate: '20XX',
        endDate: 'Present',
        bullets: (
          signals.responsibilities.length
            ? signals.responsibilities
            : [
              'Delivered scoped releases on a two-week cadence with clear owners and success metrics',
              'Improved a core workflow that reduced handoff delays by roughly 25%',
              'Partnered with design and stakeholders to ship features used by thousands of weekly users',
            ]
        )
          .slice(0, 5)
          .map((item) => item.replace(/^[-*•]\s*/, '')),
      },
      {
        company: '[Earlier Company]',
        title: '[Earlier Role]',
        location: '[City]',
        startDate: '20XX',
        endDate: '20XX',
        bullets: [
          'Owned end-to-end delivery for a customer-facing initiative with measurable outcomes',
          'Wrote clear docs and runbooks that shortened onboarding for new teammates',
        ],
      },
    ],
    education: '### [Degree], [Field], [University]\n*[City] · [Year]*',
  }

  const analysis = {
    title: signals.title,
    company: signals.company || 'Hiring Company',
    keywords: signals.keywords,
    requiredSkills: signals.requiredSkills,
    preferredSkills: signals.preferredSkills,
    responsibilities: signals.responsibilities,
    tone: signals.tone || 'professional, direct, metrics-focused',
    seniority: signals.seniority || 'mid-level',
  }

  const resume = enforceExperienceBullets(
    replaceEmDashes(buildProfessionalResumeSample(analysis, 'classic-professional', placeholderProfile)),
  )
  const coverLetter = replaceEmDashes(
    buildProfessionalCoverLetterSample(analysis, 'classic-professional', placeholderProfile),
  )

  // Keep placeholders visible (do not stamp over them with empty identity)
  return { resume, coverLetter }
}

function parseDocumentPair(raw: string): DocumentPair {
  let parsed: Partial<DocumentPair>
  try {
    parsed = JSON.parse(raw) as Partial<DocumentPair>
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (!fenced?.[1]) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Model returned invalid JSON for resume/cover letter.',
      })
    }
    parsed = JSON.parse(fenced[1].trim()) as Partial<DocumentPair>
  }

  const resume = replaceEmDashes(String(parsed.resume || '').trim())
  const coverLetter = replaceEmDashes(String(parsed.coverLetter || '').trim())

  if (!resume || !coverLetter) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Model response missing resume or coverLetter fields.',
    })
  }

  return {
    resume: enforceExperienceBullets(resume),
    coverLetter,
  }
}

function normalizeSignals(raw: Record<string, unknown>): JobSignals {
  const asList = (value: unknown) =>
    Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : []

  return {
    title: String(raw.title || 'Target Role').trim() || 'Target Role',
    company: String(raw.company || 'Hiring Company').trim() || 'Hiring Company',
    requiredSkills: asList(raw.requiredSkills),
    preferredSkills: asList(raw.preferredSkills),
    keywords: asList(raw.keywords),
    responsibilities: asList(raw.responsibilities),
    seniority: String(raw.seniority || 'mid-level').trim(),
    tone: String(raw.tone || 'professional').trim(),
  }
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (!value.trim() || seen.has(key)) continue
    seen.add(key)
    out.push(value.trim())
  }
  return out
}

/** Optional post-pass when we also have a structured profile to force identity. */
export function finalizeWithProfile(
  docs: DocumentPair,
  profile: CandidateProfile | null | undefined,
): DocumentPair {
  if (!profile?.fullName?.trim() || profile.fullName.startsWith('[')) return docs
  return {
    resume: stampCandidateIdentity(enforceExperienceBullets(docs.resume), profile),
    coverLetter: stampCandidateIdentity(docs.coverLetter, profile),
  }
}
