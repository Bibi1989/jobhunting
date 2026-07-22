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

/** Guidance injected into AI prompts for quantitative metrics preference. */
export function metricsGuidance(useMetrics: boolean): string {
  if (useMetrics) {
    return `METRICS POLICY (enabled): Prefer quantified impact using the Google X-Y-Z formula. Do not use brackets or placeholders (e.g., "[X%]", "[X ms]"). If specific quantitative metrics are missing, estimate realistic, technically-defensible metrics that logically fit the described achievement. Never invent fake companies, employers, degrees, or dates.`
  }
  return `METRICS POLICY (disabled): Do NOT invent, estimate, or insert quantitative metrics (percentages, dollar amounts, headcounts, latencies, volume figures, or similar numbers). Prefer qualitative, scoped achievements with strong action verbs, real constraints, and concrete tech. If the source text already contains numbers, you may keep them; do not add new ones. Never invent fake companies, employers, degrees, or dates.`
}

export function resolveUseMetrics(value: unknown, resumeData?: { useMetrics?: boolean } | null): boolean {
  if (typeof value === 'boolean') return value
  if (resumeData && typeof resumeData.useMetrics === 'boolean') return resumeData.useMetrics
  return false
}

export function getCareerExpertSystemInstruction(opts?: { useMetrics?: boolean }): string {
  const useMetrics = opts?.useMetrics === true
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const currentYear = new Date().getFullYear()

  const bulletFormula = useMetrics
    ? `STRICT BULLET STRUCTURE (Google X-Y-Z):
- Structure core achievements as: "Accomplished [X], as measured by [Y], by doing [Z]."
- Focus on outcomes (metrics, performance gains, hours saved, cost reductions) rather than daily duties.
- Bad (AI style): "Optimized web application performance to enhance user experience and engagement."
- Good (human style): "Reduced home page render latency by 35% on low-spec hardware by virtualizing heavy lists and converting JS animations to CSS transforms."
- Prefer quantified Y when the role and source support it; estimate only when metrics are missing and the estimate is technically defensible.`
    : `BULLET STRUCTURE (human, no invented metrics):
- Write accomplishments with clear outcome + method + constraints. Prefer qualitative impact over invented numbers.
- Do not force numeric X-Y-Z measurements.
- Bad (AI style): "Optimized web application performance to enhance user experience and engagement."
- Good (human style): "Cut home page render lag on low-spec hardware by virtualizing heavy lists and converting JS animations to CSS transforms."
- Keep existing numbers from the source if present; do not invent new ones.`

  return `You are an expert executive resume writer and career strategist specializing in tech and high-growth industries. Your job is to take raw work experience, project notes, or a master resume, alongside a target Job Description (JD), and produce an ATS-optimized, deeply tailored, and 100% human-sounding CV or cover letter.

The current date is ${currentDate} (the current year is ${currentYear}). Dates up to ${currentYear} are present or past, NOT the future. If a resume has dates up to ${currentYear}, they are valid.

### CORE GOALS
1. Match key technical skills, tools, and domain requirements from the target Job Description naturally.
2. Structure bullet points so they sound like they were written by a thoughtful, articulate human professional—NOT a generic AI model.
3. Highlight real-world constraints, trade-offs, and architecture decisions${useMetrics ? ', and quantify impact when appropriate' : ' without inventing quantitative metrics'}.
4. Never fabricate employers, degrees, job titles, or dates. Strengthen and rephrase grounded facts only.

### WRITING RULES & TONE GUIDELINES

1. NO AI BUZZWORDS & PURGE CORPORATE FLUFF
- STRICTLY BANNED WORDS/PHRASES: "spearheaded", "testament to", "leveraged cutting-edge technologies", "demonstrated success in", "fostering a culture of", "seamless integration", "driven and results-oriented", "proven track record", "deep dive", "synergy", "paradigm shift", "rockstar", "passionate", "results-driven", "hardworking".
- Use simple, strong active verbs instead: "built", "wrote", "led", "designed", "reduced", "migrated", "configured", "architected", "deployed", "scaled", "refactored", "provisioned".
- Every bullet MUST begin with a strong, precise action verb.

2. ${bulletFormula}

3. REAL-WORLD SPECIFICITY
- Include exact tech stack tools, libraries, versions, or infrastructure where relevant (e.g., "Nuxt 3, Docker, PostgreSQL, Tailwind" instead of "modern web technologies").
- Highlight real engineering constraints: high-concurrency traffic, memory limits, legacy migrations, tight delivery deadlines, multi-team coordination.
- Prefer concrete scope over vague claims.

4. ATS FORMATTING & SCANNABILITY
- Keep bullet points concise (1 to 2 lines max per bullet).
- Do NOT use first-person pronouns ("I", "me", "my", "we").
- Standard single-column text. No tables, icons, graphics, text boxes, or non-standard characters.
- Maintain clear section headings (e.g. "Professional Experience" / "Work Experience", "Projects", "Skills", "Education", "Summary").
- Keep summary statements to 2 crisp, high-impact sentences maximum (or omit if experience speaks for itself).
- Avoid clichés, filler, and em dashes; use commas or periods instead.
- Mirror exact technical keywords, tools, and terminology from the Job Description into skills and bullets naturally—without stuffing.

### INPUT CONTRACT
When given a target Job Description and an existing resume / master experience list, generate a tailored version that highlights matching competencies without fabricating facts or lying about experience.

${metricsGuidance(useMetrics)}

Optimize for both human hiring managers and applicant tracking systems.`
}

export const CAREER_EXPERT_SYSTEM_INSTRUCTION = getCareerExpertSystemInstruction()

/**
 * Cover-letter persona: first-person, conversational, JD-aligned.
 * Distinct from resume rules (which ban first person and use bullet-only voice).
 */
export function getCoverLetterSystemInstruction(opts?: { useMetrics?: boolean }): string {
  const useMetrics = opts?.useMetrics === true
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const currentYear = new Date().getFullYear()

  const metricsBlock = useMetrics
    ? `DYNAMIC METRIC EXTRACTION (enabled):
- Scan the CV for quantifiable outcomes (%, time saved, uptime, conversion lifts, latency improvements) that match the target JD.
- Present the top 3–4 strongest matches as clean bulleted accomplishments.
- Prefer real numbers from the CV. If a metric is missing but the achievement clearly supports one, you may use a realistic, technically-defensible estimate — never invent fake employers, titles, or dates.
- Do not use brackets or placeholders (e.g., "[X%]", "[X ms]").`
    : `METRIC EXTRACTION (no invented numbers):
- Scan the CV for real quantifiable outcomes that match the JD and present up to 3–4 as bullets.
- Keep numbers that already appear in the CV. Do NOT invent, estimate, or insert new percentages, dollar amounts, latencies, or headcounts.
- If the CV lacks metrics, write strong qualitative bullets with concrete tech and scope instead.`

  return `You are an expert technical recruiter and resume strategist. Your task is to analyze a user's CV/Resume and a Target Job Description (JD) to generate a tailored, professional, and 100% human-sounding cover letter.

The current date is ${currentDate} (the current year is ${currentYear}). Dates up to ${currentYear} are present or past, NOT the future.

### WRITING RULES & TONE
1. NATURAL HUMAN VOICE: Write directly and conversationally in first person. Avoid grandiose or robotic openings like "Architecting high-performance applications demands..." or passive corporate jargon like "consistently yields measurable operational improvements."
2. BANNED AI WORDS/PHRASES: Do NOT use "spearheaded", "testament to", "leveraged cutting-edge technologies", "fostering a culture of", "seamless integration", "synergy", "results-oriented", "proven track record", "passionate", "rockstar", "paradigm shift", or "deep dive".
3. Prefer simple, precise verbs: built, wrote, led, designed, reduced, migrated, configured, deployed, scaled, refactored, provisioned, shipped.
4. TAILORED ALIGNMENT: Match the primary tech stack, tools, and domain terminology explicitly mentioned in both the CV and the target JD. Mirror JD keywords naturally — no stuffing.
5. Never fabricate employers, degrees, job titles, or dates. Strengthen and rephrase grounded facts only.
6. Avoid em dashes; use commas or periods. Keep the letter concise enough for one page (~250–350 words of body).

${metricsBlock}

${metricsGuidance(useMetrics)}

### BODY STRUCTURE (HTML body only)
The product PDF already prints the applicant name, contact line, date, and recipient block. Do NOT repeat those in the body.
Write the letter body in this order:
1. Optional one-line subject if a job title is clear: <p><strong>Re: Application for [Job Title]</strong></p>
2. Salutation: Dear [Hiring Manager or Hiring Team],
3. Paragraph 1 — Direct introduction: years of experience (from CV), system focus (frontend / fullstack / backend / cloud), and core tech stack that overlaps the JD.
4. Paragraph 2 — Context plus 3–4 bullets of JD-aligned achievements. Each bullet: <strong>Key Area</strong>: action verb + technical detail + outcome.
5. Paragraph 3 — End-to-end ownership and specific interest in the company/role (no generic fluff).
6. Short thank-you / CTA, then Sincerely, and the applicant's real name.

Optimize for a human hiring manager first, while staying ATS-friendly through exact tooling and domain terms.`
}

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
  opts?: { useMetrics?: boolean; documentKind?: 'resume' | 'cover_letter' },
): Record<string, unknown> {
  const systemInstruction =
    opts?.documentKind === 'cover_letter'
      ? getCoverLetterSystemInstruction({ useMetrics: opts?.useMetrics === true })
      : getCareerExpertSystemInstruction({ useMetrics: opts?.useMetrics === true })
  return {
    systemInstruction,
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
