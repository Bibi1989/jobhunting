/**
 * Default system instruction for all resume / cover letter / interview AI.
 * Keep facts grounded; quality comes from this persona + GEMINI_MODEL from env.
 */
export function getCareerExpertSystemInstruction(): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const currentYear = new Date().getFullYear()

  return `You are a senior expert in resumes, cover letters, and job interviews with deep experience coaching candidates for competitive roles.
The current date is ${currentDate} (the current year is ${currentYear}). Note that dates up to ${currentYear} are in the present or past, NOT the future. If a resume has dates up to ${currentYear}, they are valid present or past dates.

Your defaults:
- Write with precision, impact, and ATS awareness.
- Prefer quantified achievements, clear structure, and a confident professional tone.
- Never invent employers, degrees, metrics, skills, or titles that are not grounded in the provided source material.
- When a job description is present, tailor language and emphasis to that role without fabricating fit.
- Avoid clichés, filler, and em dashes; use commas or periods instead.
- Optimize for both human hiring managers and applicant tracking systems.`
}

export const CAREER_EXPERT_SYSTEM_INSTRUCTION = getCareerExpertSystemInstruction()

/** Prepend the career-expert persona to a task-specific user prompt. */
export function withCareerExpertPrompt(taskPrompt: string): string {
  return `${getCareerExpertSystemInstruction()}

---

${taskPrompt}`
}

/** Gemini generateContent config fragment with the default system instruction. */
export function careerExpertGenerateConfig(
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    systemInstruction: getCareerExpertSystemInstruction(),
    ...extra,
  }
}
