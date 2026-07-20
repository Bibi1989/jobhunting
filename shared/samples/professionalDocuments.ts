import {
  buildCvByFormat,
  buildRichCoverLetter,
  replaceEmDashes,
} from './cvFormats'

export interface ProfessionalJobContext {
  title: string
  company: string
  keywords: string[]
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
  tone: string
  seniority: string
}

/** Canonical professional CV structure used by templates and Ollama prompts. */
export const PROFESSIONAL_RESUME_STRUCTURE = `
Use this exact Markdown structure (headings and order). Never use em dashes. Use commas instead.

# FULL NAME
Target Role Title
City, ST · email@domain.com · (555) 555-0100 · linkedin.com/in/handle · portfolio-or-github

## Professional Summary
2 to 3 sentences. Role target, years of relevant experience, strongest domains, and one proof point with a metric. No buzzwords.

## Core Competencies
Skills separated by middle dots on one line (8 to 14 skills max).

## Professional Experience
Include EVERY role from the source resume (do not drop older jobs). Most recent first.
### Company Name, Job Title
*City, ST · Mon YYYY – Present (or Mon YYYY)*
- Start each bullet with a strong verb
- Include a metric where honest (%, time saved, users, revenue, latency, uptime)
- Prefer 3 to 6 bullets per role
- CRITICAL: Every duty/achievement under Professional Experience must be a Markdown bullet starting with "- ". Never write experience as paragraphs.

### Earlier Company, Job Title
*City, ST · Mon YYYY – Mon YYYY*
- 2 to 5 bullets

## Projects
Include EVERY project from the source resume (omit this section only if the source has none).
### Project Name
- What was built, stack, and impact (2 to 4 bullets each)

## Education
### Degree, Field, University
*City, ST · Year*
- Optional honors / relevant coursework (1 line)

## Additional Information
Languages, certifications, awards — keep facts from the source.
`.trim()

export const PROFESSIONAL_COVER_LETTER_STRUCTURE = `
Use this exact Markdown structure. Never use em dashes. Use commas instead.
Write 4 to 5 rich paragraphs:

# FULL NAME
City, ST · email@domain.com · (555) 555-0100 · linkedin.com/in/handle

[Today's date as Month DD, YYYY]

Hiring Manager
Company Name

Dear Hiring Manager,

Paragraph 1, Opening: State the exact role title and company. Explain why this posting fits, with one concrete strength.

Paragraph 2, Proof: Specific achievements with metrics mapped to the posting. Concrete and honest.

Paragraph 3, Working style: How you collaborate, communicate, and deliver. Tie to the team's likely needs.

Paragraph 4, Motivation: Why this company/role, and what you want to contribute in the first 90 days.

Paragraph 5, Close: Thank them, invite a conversation, offer scheduling flexibility.

Sincerely,
Full Name
`.trim()

export function buildProfessionalResumeSample(
  analysis: ProfessionalJobContext,
  formatId?: string,
  profile?: import('./candidateProfile').CandidateProfile | null,
): string {
  return buildCvByFormat(formatId, analysis, profile)
}

export function buildProfessionalCoverLetterSample(
  analysis: ProfessionalJobContext,
  formatId?: string,
  profile?: import('./candidateProfile').CandidateProfile | null,
): string {
  return buildRichCoverLetter(analysis, formatId, profile)
}

export { replaceEmDashes }
