import {
  PROFESSIONAL_COVER_LETTER_STRUCTURE,
  PROFESSIONAL_RESUME_STRUCTURE,
  buildProfessionalCoverLetterSample,
  buildProfessionalResumeSample,
  replaceEmDashes,
} from '../../shared/samples/professionalDocuments'
import {
  type CandidateProfile,
  enforceExperienceBullets,
  hasUsableIdentity,
  isCandidateProfileComplete,
  stampCandidateIdentity,
} from '../../shared/samples/candidateProfile'
import { getCvFormat } from '../../shared/samples/cvFormats'
import { resolveCandidateProfile } from './candidateProfile'
import { ollamaChat, parseJsonObject } from './ollama'

export interface JobAnalysis {
  title: string
  company: string
  keywords: string[]
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
  tone: string
  seniority: string
}

export interface GeneratedMaterials {
  resume: string
  coverLetter: string
  analysis: JobAnalysis
  mode: 'rephrase' | 'template'
  cvFormat: string
  profile: CandidateProfile
}

const DEFAULT_ANALYSIS: JobAnalysis = {
  title: 'Target Role',
  company: 'Hiring Company',
  keywords: [],
  requiredSkills: [],
  preferredSkills: [],
  responsibilities: [],
  tone: 'professional, direct, metrics-focused',
  seniority: 'mid-level',
}

export async function analyzeJobDescription(jobDescription: string): Promise<JobAnalysis> {
  const content = await ollamaChat({
    format: 'json',
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You extract structured hiring signals from job descriptions. Return JSON only. Never invent employer facts that are not present.',
      },
      {
        role: 'user',
        content: `Analyze this job description and return JSON with keys:
title, company, keywords (array), requiredSkills (array), preferredSkills (array), responsibilities (array), tone, seniority.

Job description:
${jobDescription.slice(0, 14000)}`,
      },
    ],
  })

  const parsed = parseJsonObject<Partial<JobAnalysis>>(content)

  return {
    title: String(parsed.title || DEFAULT_ANALYSIS.title).trim() || DEFAULT_ANALYSIS.title,
    company: String(parsed.company || DEFAULT_ANALYSIS.company).trim() || DEFAULT_ANALYSIS.company,
    keywords: asStringArray(parsed.keywords),
    requiredSkills: asStringArray(parsed.requiredSkills),
    preferredSkills: asStringArray(parsed.preferredSkills),
    responsibilities: asStringArray(parsed.responsibilities),
    tone: String(parsed.tone || DEFAULT_ANALYSIS.tone).trim(),
    seniority: String(parsed.seniority || DEFAULT_ANALYSIS.seniority).trim(),
  }
}

export async function generateMaterials(input: {
  jobDescription: string
  resumeText?: string
  coverLetterText?: string
  cvFormat?: string
  candidateProfile?: Partial<CandidateProfile> | null
}): Promise<GeneratedMaterials> {
  const cvFormat = getCvFormat(input.cvFormat).id
  const analysis = await analyzeJobDescription(input.jobDescription)
  const hasResume = Boolean(input.resumeText?.trim())
  const hasCoverLetter = Boolean(input.coverLetterText?.trim())

  const profile = await resolveCandidateProfile({
    resumeText: input.resumeText,
    candidateProfile: input.candidateProfile,
  })

  if (!hasResume && !hasUsableIdentity(profile) && !isCandidateProfileComplete(profile)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Provide your name, email, phone, location, skills, and work experience, or upload a CV first.',
    })
  }

  if (hasResume || hasCoverLetter) {
    const rephrased = await rephraseExistingDocuments({
      analysis,
      jobDescription: input.jobDescription,
      resumeText: input.resumeText,
      coverLetterText: input.coverLetterText,
      cvFormat,
      profile,
    })

    const resume =
      rephrased.resume || buildProfessionalResumeSample(analysis, cvFormat, profile)
    const coverLetter =
      rephrased.coverLetter ||
      buildProfessionalCoverLetterSample(analysis, cvFormat, profile)

    return {
      analysis,
      mode: 'rephrase',
      cvFormat,
      profile,
      resume: finalizeDoc(resume, profile),
      coverLetter: finalizeDoc(coverLetter, profile),
    }
  }

  return {
    analysis,
    mode: 'template',
    cvFormat,
    profile,
    resume: finalizeDoc(buildProfessionalResumeSample(analysis, cvFormat, profile), profile),
    coverLetter: finalizeDoc(
      buildProfessionalCoverLetterSample(analysis, cvFormat, profile),
      profile,
    ),
  }
}

async function rephraseExistingDocuments(input: {
  analysis: JobAnalysis
  jobDescription: string
  resumeText?: string
  coverLetterText?: string
  cvFormat: string
  profile: CandidateProfile
}) {
  const format = getCvFormat(input.cvFormat)
  const identity = hasUsableIdentity(input.profile)
    ? `MANDATORY identity to use in both documents:
Name: ${input.profile.fullName}
Email: ${input.profile.email}
Phone: ${input.profile.phone}
Location: ${input.profile.location}
LinkedIn: ${input.profile.linkedin || ''}
The resume H1 and cover-letter signature MUST be "${input.profile.fullName}". Never write Jordan Ellis.`
    : 'Copy the candidate name/email/phone/location exactly from the existing resume. Never invent a sample name.'

  const content = await ollamaChat({
    format: 'json',
    temperature: 0.35,
    messages: [
      {
        role: 'system',
        content: `You are an expert resume and cover-letter writer.
Rules:
- ${identity}
- Rephrase only existing content; do not invent employers, degrees, dates, or skills the candidate did not claim.
- Work experience descriptions MUST be Markdown bullet points (each line starts with "- ").
- Never use em dashes. Use commas instead.
- Cover letter: 4 to 5 full paragraphs, signed with the candidate's real name.
- Return JSON with keys resume and coverLetter.`,
      },
      {
        role: 'user',
        content: `Selected CV format: ${format.name} (${format.id})

Candidate profile JSON:
${JSON.stringify(input.profile, null, 2)}

${identity}

Job analysis:
${JSON.stringify(input.analysis, null, 2)}

Resume structure:
${PROFESSIONAL_RESUME_STRUCTURE}

Cover letter structure:
${PROFESSIONAL_COVER_LETTER_STRUCTURE}

${
  hasUsableIdentity(input.profile)
    ? `Header example (use this identity):\n# ${input.profile.fullName}\n${[
        input.profile.location,
        input.profile.email,
        input.profile.phone,
      ]
        .filter(Boolean)
        .join(' · ')}\n`
    : ''
}

Job description:
${input.jobDescription.slice(0, 10000)}

Existing resume (source of truth for identity):
${(input.resumeText || '(not provided)').slice(0, 12000)}

Existing cover letter:
${(input.coverLetterText || '(not provided)').slice(0, 8000)}

Return JSON: {"resume":"...markdown...","coverLetter":"...markdown..."}`,
      },
    ],
  })

  const parsed = parseJsonObject<{ resume?: string; coverLetter?: string }>(content)
  return {
    resume: replaceEmDashes(parsed.resume?.trim() || ''),
    coverLetter: replaceEmDashes(parsed.coverLetter?.trim() || ''),
  }
}

function finalizeDoc(text: string, profile: CandidateProfile): string {
  return stampCandidateIdentity(enforceExperienceBullets(replaceEmDashes(text)), profile)
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
}
