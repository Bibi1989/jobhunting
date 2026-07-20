import { Type, type GoogleGenAI } from '@google/genai'
import type {
  ApplicationFormExtract,
  ApplicationQuestion,
  Job,
} from '../../shared/types/job'
import { resolveCandidateProfileSync } from './candidateProfile'
import { generateWithModels } from './gemini'
import { formatGeminiError } from './jobs'
import { ollamaJsonPrompt } from './aiFallback'
import {
  cleanHtmlForApplicationForm,
  fetchPageHtml,
} from './scraper'

const QUESTIONS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    notes: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          type: {
            type: Type.STRING,
            description:
              'text | textarea | select | radio | checkbox | boolean | number | url | email | file | unknown',
          },
          required: { type: Type.BOOLEAN },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          helpText: { type: Type.STRING },
          section: { type: Type.STRING },
        },
        required: ['id', 'label', 'type'],
      },
    },
  },
  required: ['questions'],
} as const

const ANSWERS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          answer: { type: Type.STRING },
          notes: {
            type: Type.STRING,
            description: 'Short tip for the candidate about this answer',
          },
        },
        required: ['id', 'answer'],
      },
    },
  },
  required: ['answers'],
} as const

export async function extractApplicationForm(
  ai: GoogleGenAI,
  models: string[],
  job: Job,
): Promise<ApplicationFormExtract> {
  const { html, isError, status, statusText, finalUrl } = await fetchPageHtml(job.url)
  let questions: ApplicationQuestion[] = []
  let notes: string | undefined
  let title: string | undefined
  let extractedFrom: ApplicationFormExtract['extractedFrom'] = 'inferred'

  if (!isError && status < 400 && html) {
    const cleaned = cleanHtmlForApplicationForm(html, finalUrl)
    const fromHtml = await extractQuestionsFromHtml(ai, models, cleaned, job, finalUrl)
    questions = fromHtml.questions
    notes = fromHtml.notes
    title = fromHtml.title
    if (questions.length > 0) extractedFrom = 'html'
  } else {
    notes = `Could not load application page (${statusText}). Inferring likely screening questions from the job posting.`
  }

  // Many ATS pages are JS-rendered — if HTML had little/no form, infer technical/screening Qs.
  if (questions.length < 3) {
    const inferred = await inferQuestionsFromJob(ai, models, job)
    const existing = new Set(questions.map((q) => q.label.toLowerCase()))
    const extras = inferred.questions.filter((q) => !existing.has(q.label.toLowerCase()))
    const hadHtmlQuestions = questions.length > 0
    questions = [...questions, ...extras]
    extractedFrom = hadHtmlQuestions ? 'mixed' : 'inferred'
    if (inferred.notes) {
      notes = [notes, inferred.notes].filter(Boolean).join(' ')
    }
  }

  return {
    sourceUrl: job.url,
    finalUrl,
    title: title || job.title,
    questions: questions.map((q, i) => ({
      ...q,
      id: q.id || `q-${i + 1}`,
      answer: q.answer || '',
    })),
    notes,
    extractedFrom,
  }
}

export async function answerApplicationQuestions(
  ai: GoogleGenAI,
  models: string[],
  job: Job,
  questions: ApplicationQuestion[],
  resumeText?: string,
  coverLetterText?: string,
): Promise<ApplicationQuestion[]> {
  if (!questions.length) return []

  const profile = resolveCandidateProfileSync({ resumeText })
  // Pre-fill contact / identity fields from the uploaded CV before calling the model
  const prefilled = autofillFromProfile(questions, profile, resumeText)

  try {
    const response = await generateWithModels(
      ai,
      models,
      (model) =>
        ai.models.generateContent({
          model,
          contents: `You are an application-form autofill assistant.
Fill EVERY question with a ready-to-paste answer. Do not leave answers blank.

Rules:
1) Contact fields (name, email, phone, location, LinkedIn, portfolio, GitHub): use exact values from the resume/profile.
2) Yes/no, boolean, select, radio: choose the best matching option from the provided options when present.
3) File uploads: write a short instruction (e.g. "Upload tailored resume PDF").
4) TECHNICAL / coding / system-design / experience questions: write concrete 4–8 sentence answers grounded in real roles, projects, tools, and outcomes from the resume. Prefer specifics (company names, stack, metrics) over generic fluff. Never invent employers or projects not in the resume.
5) Motivation / why this company: 3–5 honest sentences tied to the job description and the candidate's background.
6) Salary / compensation: give a reasonable range note or "Open to discussion based on total compensation" if unknown.
7) Work authorization / notice period / relocation: answer honestly from the resume when possible; otherwise a clear placeholder the candidate can edit.
8) Never use em dashes; use commas.

Candidate identity:
Name: ${profile.fullName || '(from resume)'}
Email: ${profile.email || ''}
Phone: ${profile.phone || ''}
Location: ${profile.location || ''}
LinkedIn: ${profile.linkedin || ''}
Website: ${profile.website || ''}
Skills: ${(profile.skills || []).slice(0, 16).join(', ')}
Roles: ${profile.experiences
  .map((e) => `${e.title} at ${e.company}`)
  .slice(0, 6)
  .join('; ')}
Projects: ${(profile.projects || [])
  .map((p) => p.name)
  .slice(0, 6)
  .join('; ')}

Job:
Title: ${job.title}
Company: ${job.company || 'Unknown'}
Location: ${job.location}
Description:
${(job.description || '').slice(0, 10000)}

Resume (source of truth):
${(resumeText || 'Not provided').slice(0, 20000)}

Cover letter:
${(coverLetterText || 'Not provided').slice(0, 6000)}

Questions JSON (return an answer for every id):
${JSON.stringify(
  prefilled.map((q) => ({
    id: q.id,
    label: q.label,
    type: q.type,
    required: q.required,
    options: q.options,
    helpText: q.helpText,
    section: q.section,
    suggestedAnswer: q.answer || undefined,
  })),
)}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: ANSWERS_SCHEMA,
            temperature: 0.35,
            maxOutputTokens: 12288,
          },
        }),
      async () => {
        const parsed = await ollamaJsonPrompt<{
          answers?: Array<{ id: string; answer: string; notes?: string }>
        }>({
          system:
            'Answer every job application question honestly from the resume. Technical questions need concrete examples. Return JSON {"answers":[{"id","answer","notes"}]}.',
          user: `Job: ${job.title} at ${job.company || 'Unknown'}
Description: ${(job.description || '').slice(0, 8000)}
Resume: ${(resumeText || 'Not provided').slice(0, 12000)}
Cover letter: ${(coverLetterText || 'Not provided').slice(0, 4000)}
Profile: ${JSON.stringify({
            name: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            location: profile.location,
            skills: profile.skills,
            experiences: profile.experiences.slice(0, 4),
            projects: (profile.projects || []).slice(0, 4),
          })}
Questions: ${JSON.stringify(prefilled.map((q) => ({ id: q.id, label: q.label, type: q.type, options: q.options })))}`,
        })
        return { text: JSON.stringify(parsed) }
      },
    )

    const parsed = JSON.parse(response.text || '{"answers":[]}') as {
      answers?: Array<{ id: string; answer: string; notes?: string }>
    }
    const byId = new Map((parsed.answers || []).map((a) => [a.id, a]))

    const merged = prefilled.map((q) => {
      const hit = byId.get(q.id)
      const answer = (hit?.answer || q.answer || '').trim()
      return {
        ...q,
        answer,
        notes: hit?.notes || q.notes,
      }
    })

    // Ensure contact fields stay filled even if the model skipped them
    return autofillFromProfile(merged, profile, resumeText, { onlyEmpty: true })
  } catch (error) {
    console.warn(
      'Application answer generation failed — using profile autofill fallback:',
      formatGeminiError(error),
    )
    return buildFallbackAnswers(prefilled, job, profile, resumeText)
  }
}

/**
 * Deterministic autofill for common application fields from the parsed CV profile.
 */
export function autofillFromProfile(
  questions: ApplicationQuestion[],
  profile: ReturnType<typeof resolveCandidateProfileSync>,
  resumeText?: string,
  options?: { onlyEmpty?: boolean },
): ApplicationQuestion[] {
  const onlyEmpty = Boolean(options?.onlyEmpty)

  return questions.map((q) => {
    if (onlyEmpty && q.answer?.trim()) return q

    const label = `${q.label} ${q.helpText || ''} ${q.section || ''}`.toLowerCase()
    const kind = classifyField(label, q.type)
    let answer = q.answer || ''

    switch (kind) {
      case 'fullName':
        answer = profile.fullName || answer
        break
      case 'firstName':
        answer = profile.fullName.split(/\s+/)[0] || answer
        break
      case 'lastName':
        answer = profile.fullName.split(/\s+/).slice(1).join(' ') || answer
        break
      case 'email':
        answer = profile.email || answer
        break
      case 'phone':
        answer = profile.phone || answer
        break
      case 'location':
        answer = profile.location || answer
        break
      case 'linkedin':
        answer = profile.linkedin || answer
        break
      case 'website':
        answer = profile.website || profile.linkedin || answer
        break
      case 'summary':
        answer = profile.summary || answer
        break
      case 'skills':
        answer = profile.skills.join(', ') || answer
        break
      case 'fileResume':
        answer = 'Upload your tailored resume / CV PDF'
        break
      case 'fileCover':
        answer = 'Upload your tailored cover letter PDF'
        break
      case 'booleanYes':
        answer = pickOption(q.options, ['yes', 'true', 'authorized', 'willing']) || 'Yes'
        break
      case 'booleanNo':
        answer = pickOption(q.options, ['no', 'false']) || 'No'
        break
      default:
        break
    }

    return { ...q, answer: answer || q.answer || '' }
  })
}

function buildFallbackAnswers(
  questions: ApplicationQuestion[],
  job: Job,
  profile: ReturnType<typeof resolveCandidateProfileSync>,
  resumeText?: string,
): ApplicationQuestion[] {
  const filled = autofillFromProfile(questions, profile, resumeText, { onlyEmpty: false })
  const proof =
    profile.experiences[0] &&
    `${profile.experiences[0].title} at ${profile.experiences[0].company}: ${(
      profile.experiences[0].bullets[0] || ''
    ).slice(0, 220)}`
  const projectProof =
    profile.projects?.[0] &&
    `${profile.projects[0].name}: ${(profile.projects[0].bullets[0] || '').slice(0, 180)}`

  return filled.map((q) => {
    if (q.answer?.trim()) return q
    const label = q.label.toLowerCase()
    const isTechnical =
      /tech|stack|architect|system|design|coding|algorithm|cloud|kubernetes|api|database|experience|project|challenge|accomplish|skill|framework|language|devops|frontend|backend|full.?stack/i.test(
        label,
      )

    if (isTechnical) {
      const parts = [
        proof ? `In my recent role as ${proof}` : null,
        projectProof ? `I also worked on ${projectProof}` : null,
        profile.skills.length
          ? `Relevant tools from my background include ${profile.skills.slice(0, 8).join(', ')}.`
          : null,
        `I am ready to apply this experience to the ${job.title} role at ${job.company || 'your company'}.`,
      ].filter(Boolean)
      return {
        ...q,
        answer: parts.join(' '),
        notes: 'Fallback answer from your CV — edit before submitting.',
      }
    }

    if (/why|motivat|interest|join|company|role|position/i.test(label)) {
      return {
        ...q,
        answer: `I am applying for the ${job.title} role because it aligns with my experience as ${
          profile.experiences[0]
            ? `${profile.experiences[0].title} at ${profile.experiences[0].company}`
            : 'a software engineer'
        }. I want to contribute where ${profile.skills.slice(0, 4).join(', ') || 'my stack'} can help ${
          job.company || 'the team'
        } ship reliable product outcomes.`,
        notes: 'Fallback motivation answer from your CV — edit before submitting.',
      }
    }

    return {
      ...q,
      answer: q.answer || '',
      notes: q.notes || 'Could not auto-answer this field — fill manually.',
    }
  })
}

function classifyField(
  label: string,
  type: ApplicationQuestion['type'],
):
  | 'fullName'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'location'
  | 'linkedin'
  | 'website'
  | 'summary'
  | 'skills'
  | 'fileResume'
  | 'fileCover'
  | 'booleanYes'
  | 'booleanNo'
  | 'other' {
  if (type === 'email' || /\bemail\b|e-mail/.test(label)) return 'email'
  if (type === 'url' && /linkedin/.test(label)) return 'linkedin'
  if (/linkedin/.test(label)) return 'linkedin'
  if (/portfolio|github|website|personal site|url/.test(label)) return 'website'
  if (/\bphone\b|mobile|tel\b|whatsapp/.test(label)) return 'phone'
  if (/first name|given name|vorname/.test(label)) return 'firstName'
  if (/last name|surname|family name|nachname/.test(label)) return 'lastName'
  if (/full name|^name$|legal name|candidate name|your name/.test(label) || (/\bname\b/.test(label) && !/company|file|user/.test(label)))
    return 'fullName'
  if (/city|location|address|where do you (live|reside)|based in|country/.test(label)) return 'location'
  if (/summary|about you|tell us about|bio|profile/.test(label) && type === 'textarea') return 'summary'
  if (/skills|technologies|tech stack|tools you/.test(label) && type !== 'textarea') return 'skills'
  if (type === 'file' || /upload|attach/.test(label)) {
    if (/cover/.test(label)) return 'fileCover'
    return 'fileResume'
  }
  if (type === 'boolean' || /authorized to work|work authorization|visa|sponsorship|willing to relocate|remote ok/.test(label)) {
    if (/sponsor|visa|require.*visa/.test(label) && /need|require|do you need/.test(label)) return 'booleanNo'
    return 'booleanYes'
  }
  return 'other'
}

function pickOption(options: string[] | undefined, needles: string[]): string | '' {
  if (!options?.length) return ''
  const lowerNeedles = needles.map((n) => n.toLowerCase())
  const hit = options.find((opt) => lowerNeedles.some((n) => opt.toLowerCase().includes(n)))
  return hit || ''
}

async function extractQuestionsFromHtml(
  ai: GoogleGenAI,
  models: string[],
  html: string,
  job: Job,
  url: string,
) {
  const response = await generateWithModels(
    ai,
    models,
    (model) =>
      ai.models.generateContent({
        model,
        contents: `Extract EVERY application form field / screening question from this careers application HTML.
Include personal fields (name, email, phone, LinkedIn, portfolio), demographic/EEO if present, and especially technical or open-ended questions.
Use stable ids like html-1, html-2.
Ignore cookie banners and navigation.
Job: ${job.title} at ${job.company || 'unknown'} — ${url}

HTML:
${html.slice(0, 90000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: QUESTIONS_SCHEMA,
        },
      }),
    async () => {
      const parsed = await ollamaJsonPrompt<{
        title?: string
        notes?: string
        questions?: ApplicationQuestion[]
      }>({
        system:
          'Extract application form questions from HTML. Return JSON {"title","notes","questions":[{"id","label","type","required","options","helpText","section"}]}.',
        user: `Job: ${job.title} at ${job.company || 'unknown'} — ${url}\n\nHTML:\n${html.slice(0, 50000)}`,
      })
      return { text: JSON.stringify(parsed) }
    },
  )

  const parsed = JSON.parse(response.text || '{"questions":[]}') as {
    title?: string
    notes?: string
    questions?: ApplicationQuestion[]
  }

  return {
    title: parsed.title,
    notes: parsed.notes,
    questions: normalizeQuestions(parsed.questions || [], 'html'),
  }
}

async function inferQuestionsFromJob(
  ai: GoogleGenAI,
  models: string[],
  job: Job,
) {
  const response = await generateWithModels(
    ai,
    models,
    (model) =>
      ai.models.generateContent({
        model,
        contents: `The application form HTML was incomplete or JavaScript-rendered.
Infer the likely application / screening questions a candidate will see for this role on a modern ATS (Greenhouse, Lever, Workday, Ashby).
Include:
- standard contact fields (full name, email, phone, location, LinkedIn, portfolio/GitHub)
- resume/cover letter uploads
- work authorization / relocation if relevant
- 5–10 technical or role-specific screening questions grounded in the job description (stack, systems, past projects, debugging, collaboration)
Use ids like inferred-1, inferred-2.

Job:
Title: ${job.title}
Company: ${job.company || 'Unknown'}
Location: ${job.location}
URL: ${job.url}
Description:
${(job.description || '').slice(0, 12000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: QUESTIONS_SCHEMA,
        },
      }),
    async () => {
      const parsed = await ollamaJsonPrompt<{
        notes?: string
        questions?: ApplicationQuestion[]
      }>({
        system:
          'Infer ATS application questions for a role. Return JSON {"notes","questions":[{"id","label","type","required","options","section"}]}.',
        user: `Title: ${job.title}\nCompany: ${job.company || 'Unknown'}\nLocation: ${job.location}\nURL: ${job.url}\nDescription:\n${(job.description || '').slice(0, 8000)}`,
      })
      return { text: JSON.stringify(parsed) }
    },
  )

  const parsed = JSON.parse(response.text || '{"questions":[]}') as {
    notes?: string
    questions?: ApplicationQuestion[]
  }

  return {
    notes:
      parsed.notes ||
      'Some questions were inferred because the live form may be JavaScript-rendered. Verify against the company site before submitting.',
    questions: normalizeQuestions(parsed.questions || [], 'inferred'),
  }
}

function normalizeQuestions(
  questions: ApplicationQuestion[],
  prefix: 'html' | 'inferred',
): ApplicationQuestion[] {
  return questions
    .filter((q) => q?.label?.trim())
    .map((q, i) => ({
      id: String(q.id || `${prefix}-${i + 1}`),
      label: String(q.label).trim(),
      type: (q.type || 'textarea') as ApplicationQuestion['type'],
      required: !!q.required,
      options: Array.isArray(q.options)
        ? q.options.map(String).filter(Boolean)
        : undefined,
      helpText: q.helpText ? String(q.helpText) : undefined,
      section: q.section ? String(q.section) : undefined,
      answer: '',
    }))
}
