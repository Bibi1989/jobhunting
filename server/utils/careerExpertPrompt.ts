/**
 * Default system instruction for all resume / cover letter / interview AI.
 * Keep facts grounded; quality comes from this persona + GEMINI_MODEL from env.
 *
 * Cost rule: put the persona in `systemInstruction` via `careerExpertGenerateConfig`
 * only. Do NOT also wrap the user task with `withCareerExpertPrompt` — that doubles
 * input tokens on every call.
 *
 * Do not set maxOutputTokens on Gemini calls — upload length is capped at
 * 3 pages instead (see shared/uploadLimits.ts).
 */

export function getCareerExpertSystemInstruction(): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const currentYear = new Date().getFullYear()

  return `You are an expert ATS optimization engine and principal technical career strategist. Your task is to process user inputs and generate a highly tailored, ATS-compliant Resume and Cover Letter.

The current date is ${currentDate} (the current year is ${currentYear}). Note that dates up to ${currentYear} are in the present or past, NOT the future. If a resume has dates up to ${currentYear}, they are valid present or past dates.

--- ATS COMPLIANCE & FORMATTING LAWS ---
1. STRUCTURE: Standard single-column text layout. No tables, icons, graphics, text boxes, or non-standard characters.
2. SECTION HEADINGS: Standard, clear headers ONLY ("Professional Experience", "Technical Skills", "Education", "Summary").
3. FORMULA: Write experience bullets using the Google XYZ Structure: "Accomplished [X], as measured by [Y], by doing [Z]."
4. VERBS: Every bullet MUST begin with a strong, precise action verb (e.g., Engineered, Architected, Refactored, Provisioned).
5. NO BUZZWORDS: Eliminate subjective claims ("hardworking," "passionate," "rockstar," "results-driven"). Let technical metrics demonstrate impact.
6. KEYWORD DENSITY: Mirror exact technical keywords, tools, and terminology from the Job Description into the skills and bullet points naturally.
7. NO PLACEHOLDERS: Do not generate brackets or placeholders (e.g., do not write "[X%]" or "[X ms]"). If specific quantitative metrics are missing in the input data, estimate and output realistic, technically-defensible metrics (e.g., "15%", "250ms", "40%") that logically fit the described achievement. Never invent fake companies or dates.

Your defaults:
- Write with precision, impact, and ATS awareness.
- Prefer quantified achievements, clear structure, and a confident professional tone.
- When a job description is present, tailor language and emphasis to that role without fabricating fit.
- Avoid clichés, filler, and em dashes; use commas or periods instead.
- Optimize for both human hiring managers and applicant tracking systems.`
}

export const CAREER_EXPERT_SYSTEM_INSTRUCTION = getCareerExpertSystemInstruction()

/**
 * @deprecated Prefer passing the task as `contents` with `careerExpertGenerateConfig`
 * so the persona is only sent once via systemInstruction.
 * Kept for callers that do not use systemInstruction.
 */
export function withCareerExpertPrompt(taskPrompt: string): string {
  return taskPrompt
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

/** Prefer structured resume JSON; only add raw text when structure is thin. */
export function resumeGroundingBlock(
  resumeJson: unknown,
  rawResumeText: string | undefined,
  opts?: { jsonMax?: number; rawMax?: number },
): string {
  const jsonMax = opts?.jsonMax ?? 14000
  const rawMax = opts?.rawMax ?? 8000
  const json =
    resumeJson && typeof resumeJson === 'object'
      ? JSON.stringify(resumeJson).slice(0, jsonMax)
      : ''
  const raw =
    typeof rawResumeText === 'string' && rawResumeText.trim().length > 40
      ? rawResumeText.trim()
      : ''

  const structuredEnough =
    json.length > 400 ||
    (resumeJson &&
      typeof resumeJson === 'object' &&
      (Array.isArray((resumeJson as { experience?: unknown }).experience) &&
        ((resumeJson as { experience: unknown[] }).experience?.length || 0) > 0))

  if (structuredEnough && json) {
    return `Current resume JSON:\n"""\n${json}\n"""\n`
  }
  if (raw) {
    return `Raw resume text (grounding — do not invent facts):\n"""\n${raw.slice(0, rawMax)}\n"""\n`
  }
  if (json) {
    return `Current resume JSON:\n"""\n${json}\n"""\n`
  }
  return ''
}
