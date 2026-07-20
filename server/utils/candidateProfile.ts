import {
  type CandidateExperience,
  type CandidateProfile,
  type CandidateProject,
  EMPTY_CANDIDATE_PROFILE,
  ensureBullets,
  normalizeCandidateProfile,
} from '../../shared/samples/candidateProfile'

const SECTION_ALIASES: Record<string, string> = {
  profile: 'summary',
  about: 'summary',
  summary: 'summary',
  'professional summary': 'summary',
  'technical skills': 'skills',
  skills: 'skills',
  'core competencies': 'skills',
  toolkit: 'skills',
  'professional experience': 'experience',
  experience: 'experience',
  'work experience': 'experience',
  'work history': 'experience',
  employment: 'experience',
  projects: 'projects',
  'selected projects': 'projects',
  'personal projects': 'projects',
  education: 'education',
  certifications: 'other',
  'additional information': 'other',
  awards: 'other',
}

function normalizeSectionKey(line: string): string | null {
  const cleaned = line
    .replace(/^#{1,3}\s+/, '')
    .replace(/^\*+|\*+$/g, '')
    .replace(/[:\-–—]+\s*$/, '')
    .trim()
  if (!cleaned || cleaned.length > 60) return null

  const lower = cleaned.toLowerCase()
  if (SECTION_ALIASES[lower]) return SECTION_ALIASES[lower]

  // ALL CAPS section headers like PROFESSIONAL EXPERIENCE
  const isAllCaps =
    cleaned === cleaned.toUpperCase() &&
    /[A-Z]/.test(cleaned) &&
    cleaned.split(/\s+/).length <= 5 &&
    !/[•@]/.test(cleaned)
  if (isAllCaps && SECTION_ALIASES[lower]) return SECTION_ALIASES[lower]

  // Partial: line starts with known section word
  for (const [alias, key] of Object.entries(SECTION_ALIASES)) {
    if (lower === alias || lower.startsWith(`${alias} `)) return key
  }

  return null
}

function isSectionHeading(line: string): boolean {
  return normalizeSectionKey(line) !== null
}

function hasDateSignal(line: string): boolean {
  return (
    /\b(19|20)\d{2}\b/.test(line) ||
    /\b(present|current|heute)\b/i.test(line)
  )
}

function isRoleHeader(line: string): boolean {
  if (!line || /^[-*•]/.test(line) || isSectionHeading(line)) return false
  if (line.length > 160) return false
  // Require a real year (or Present) plus a separator — avoids wrapped bullet false positives
  if (!hasDateSignal(line)) return false
  if (!/[,|–—\-]/.test(line) && !/\b(remote|hybrid|onsite)\b/i.test(line)) return false
  // Prefer lines that look like job/project headers, not long prose
  if (line.length > 110 && !/\b(19|20)\d{2}\b/.test(line)) return false
  return true
}

function parseRoleHeader(line: string): CandidateExperience {
  const cleaned = line.replace(/^#{1,3}\s+/, '').replace(/\*+/g, '').trim()
  const locationMatch = cleaned.match(/\|\s*([^|]+)\s*$/)
  const location = (locationMatch?.[1] || '').trim()
  const withoutLocation = cleaned.replace(/\|\s*[^|]+$/, '').trim()

  const dateMatch =
    withoutLocation.match(
      /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4})\s*[–—\-to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4}|Present|Current)/i,
    ) || withoutLocation.match(/\(([^)]+)\)\s*$/)

  let startDate = ''
  let endDate = ''
  let withoutDates = withoutLocation
  if (dateMatch) {
    if (dateMatch[1] && dateMatch[2] && !dateMatch[0].startsWith('(')) {
      startDate = dateMatch[1].trim()
      endDate = dateMatch[2].trim()
      withoutDates = withoutLocation.replace(dateMatch[0], '').trim()
    } else {
      const parts = String(dateMatch[1] || dateMatch[0] || '')
        .replace(/[()]/g, '')
        .split(/[–,to—\-]+/i)
        .map((p) => p.trim())
        .filter(Boolean)
      startDate = parts[0] || ''
      endDate = parts[1] || ''
      withoutDates = withoutLocation.replace(/\(([^)]+)\)\s*$/, '').replace(dateMatch[0], '').trim()
    }
  }

  // Prefer "Title, Company" then "Company, Title"
  const parts = withoutDates
    .split(/[,|]/)
    .map((p) => p.trim())
    .filter(Boolean)

  let title = ''
  let company = ''
  if (parts.length >= 2) {
    // Heuristic: last chunk often company if first looks like a title
    const firstLooksLikeTitle =
      /\b(engineer|developer|manager|lead|designer|analyst|consultant|intern|director|architect|founder|specialist)\b/i.test(
        parts[0],
      )
    if (firstLooksLikeTitle) {
      title = parts[0]
      company = parts.slice(1).join(', ')
    } else {
      company = parts[0]
      title = parts.slice(1).join(', ')
    }
  } else {
    title = parts[0] || 'Role'
    company = 'Employer'
  }

  return {
    company,
    title,
    location,
    startDate,
    endDate,
    bullets: [],
  }
}

/** Fast heuristic extract from pasted/uploaded resume text (no LLM). */
export function extractCandidateProfileHeuristic(resumeText: string): CandidateProfile {
  const text = resumeText.trim()
  if (!text) return { ...EMPTY_CANDIDATE_PROFILE }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean)

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){1,2}\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})?/,
  )
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i)
  const websiteMatch = text.match(
    /(?:https?:\/\/)(?:www\.)?(?!linkedin\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[^\s]*)?/i,
  )

  let fullName = ''

  const labeled = text.match(
    /(?:^|\n)\s*(?:full\s*)?name\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{1,60})/i,
  )
  if (labeled?.[1]) fullName = labeled[1].trim()

  if (!fullName) {
    fullName =
      lines.find((line) => {
        const cleaned = line.split(/[|·•]/)[0].trim()
        if (cleaned.length < 3 || cleaned.length > 70) return false
        if (
          /@|http|linkedin|phone|email|summary|experience|education|skills|profile|curriculum|resume|cv\b|portfolio/i.test(
            cleaned,
          )
        ) {
          return false
        }
        if (/\d{5,}/.test(cleaned)) return false
        const words = cleaned.split(/\s+/).filter(Boolean)
        if (words.length < 2 || words.length > 6) return false
        return /^[\p{L}][\p{L} .'-]*$/u.test(cleaned)
      }) || ''
    fullName = fullName.split(/[|·•]/)[0].trim()
  }

  if (!fullName) {
    const caps = lines.slice(0, 5).find((line) => {
      const words = line.split(/\s+/)
      return (
        words.length >= 2 &&
        words.length <= 5 &&
        line === line.toUpperCase() &&
        /^[A-Z][A-Z .'-]+$/.test(line) &&
        !/RESUME|CURRICULUM|CV|PROFILE/.test(line)
      )
    })
    if (caps) {
      fullName = caps.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    }
  }

  const location =
    lines.find((line) => {
      if (/@/.test(line) || /linkedin/i.test(line) || line.length > 90) return false
      if (line === fullName) return false
      return (
        /\b(Street|St\.|Road|Rd\.|Avenue|Ave\.|City|State|Province|Country|Remote|Germany|UK|USA)\b/i.test(
          line,
        ) ||
        /,\s*[A-Z]{2}\b/.test(line) ||
        /\b(London|Berlin|Hamburg|Paris|Lagos|Nairobi|Accra|Cairo|Dubai|Toronto|New York|San Francisco|Los Angeles|Chicago|Austin|Seattle|Boston|Amsterdam|Madrid|Rome|Sydney|Singapore|Abuja|Port Harcourt|Johannesburg|Cape Town)\b/i.test(
          line,
        ) ||
        (/[A-Za-z]+,\s*[A-Za-z]+/.test(line) && !/@/.test(line) && line.split(/\s+/).length <= 8)
      )
    }) || ''

  const experiences = extractExperiencesHeuristic(text)
  const projects = extractProjectsHeuristic(text)
  const skills = extractSkillsHeuristic(text)
  const education = extractEducationHeuristic(text)
  const summary = extractSummaryHeuristic(text)

  return normalizeCandidateProfile({
    fullName,
    email: emailMatch?.[0] || '',
    phone: (phoneMatch?.[0] || '').trim(),
    location: location.replace(/^location\s*[:\-]\s*/i, '').trim(),
    linkedin: linkedinMatch?.[0] || '',
    website: websiteMatch?.[0] || '',
    summary,
    skills,
    experiences,
    projects,
    education,
  })
}

export function extractExperiencesHeuristic(resumeText: string): CandidateExperience[] {
  const lines = resumeText
    .split(/\r?\n/)
    .map((l) => l.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean)

  const experiences: CandidateExperience[] = []
  let inExperience = false
  let current: CandidateExperience | null = null

  const flush = () => {
    if (current && (current.company || current.title || current.bullets.length)) {
      experiences.push({
        ...current,
        bullets: ensureBullets(
          current.bullets.length ? current.bullets : ['Contributed to team delivery goals'],
        ),
      })
    }
    current = null
  }

  for (const line of lines) {
    const section = normalizeSectionKey(line)
    if (section) {
      if (section === 'experience') {
        inExperience = true
        flush()
        continue
      }
      if (inExperience) {
        flush()
        inExperience = false
      }
      continue
    }

    if (!inExperience) continue

    if (/^[-*•]/.test(line)) {
      if (!current) {
        current = {
          company: 'Employer',
          title: 'Role',
          location: '',
          startDate: '',
          endDate: '',
          bullets: [],
        }
      }
      current.bullets.push(line.replace(/^[-*•]\s*/, '').trim())
      continue
    }

    if (isRoleHeader(line)) {
      flush()
      current = parseRoleHeader(line)
      continue
    }

    // Continuation of a wrapped bullet without marker
    if (current && line && current.bullets.length) {
      const last = current.bullets[current.bullets.length - 1]
      if (last.length < 280 && !/^[A-Z][a-z]+ [A-Z]/.test(line)) {
        current.bullets[current.bullets.length - 1] = `${last} ${line}`.trim()
        continue
      }
    }
  }

  flush()
  return experiences.slice(0, 12)
}

export function extractProjectsHeuristic(resumeText: string): CandidateProject[] {
  const lines = resumeText
    .split(/\r?\n/)
    .map((l) => l.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean)

  const projects: CandidateProject[] = []
  let inProjects = false
  let current: CandidateProject | null = null

  const flush = () => {
    if (current && (current.name || current.bullets.length)) {
      projects.push({
        name: current.name || 'Project',
        bullets: ensureBullets(
          current.bullets.length
            ? current.bullets
            : ['Delivered a scoped personal/professional project'],
        ),
      })
    }
    current = null
  }

  for (const line of lines) {
    const section = normalizeSectionKey(line)
    if (section) {
      if (section === 'projects') {
        inProjects = true
        flush()
        continue
      }
      if (inProjects) {
        flush()
        inProjects = false
      }
      continue
    }

    if (!inProjects) continue

    if (/^[-*•]/.test(line)) {
      if (!current) {
        current = { name: 'Project', bullets: [] }
      }
      current.bullets.push(line.replace(/^[-*•]\s*/, '').trim())
      continue
    }

    // Project headers look like roles: "Leihhub , Lead Engineer Apr 2026 – Present"
    if (isRoleHeader(line)) {
      flush()
      const parsed = parseRoleHeader(line)
      current = {
        name: [parsed.company, parsed.title].filter(Boolean).join(' — ') || line,
        bullets: [],
      }
      continue
    }

    if (current && line && current.bullets.length) {
      const last = current.bullets[current.bullets.length - 1]
      current.bullets[current.bullets.length - 1] = `${last} ${line}`.trim()
      continue
    }

    if (!current && line && !/^[-*•]/.test(line)) {
      current = { name: line.replace(/^#{1,3}\s+/, '').trim(), bullets: [] }
    }
  }

  flush()
  return projects.slice(0, 10)
}

function extractSkillsHeuristic(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean)

  const collected: string[] = []
  let inSkills = false
  const skillCategories =
    /^(languages|frontend(\s+technologies)?|backend(\s+technologies)?|cloud(\s*&\s*devops)?|devops|testing(\s*&\s*tools)?|tools|ai assisted tool|frameworks|libraries)$/i

  for (const line of lines) {
    const section = normalizeSectionKey(line)
    if (section === 'skills') {
      inSkills = true
      continue
    }
    // Only leave skills for major resume sections, not skill category labels
    if (section && section !== 'skills' && section !== 'other') {
      inSkills = false
      continue
    }
    if (!inSkills) continue
    if (skillCategories.test(line)) continue

    const parts = line
      .replace(/^[-*•]\s*/, '')
      .split(/[·|,;/]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 48)

    collected.push(...parts)
  }

  return [...new Set(collected)].slice(0, 18)
}

function extractEducationHeuristic(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean)

  const block: string[] = []
  let inEdu = false
  for (const line of lines) {
    const section = normalizeSectionKey(line)
    if (section) {
      if (section === 'education') {
        inEdu = true
        continue
      }
      if (inEdu) break
      continue
    }
    if (inEdu) block.push(line)
  }

  return block.slice(0, 6).join('\n')
}

function extractSummaryHeuristic(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean)

  const block: string[] = []
  let inSummary = false
  for (const line of lines) {
    const section = normalizeSectionKey(line)
    if (section) {
      if (section === 'summary') {
        inSummary = true
        continue
      }
      if (inSummary) break
      continue
    }
    if (inSummary) block.push(line.replace(/^[-*•]\s*/, ''))
  }

  return block.join(' ').slice(0, 700)
}

/** Sync resolve — no LLM. Fast path for tailor generation. */
export function resolveCandidateProfileSync(input: {
  resumeText?: string
  candidateProfile?: Partial<CandidateProfile> | null
}): CandidateProfile {
  const fromForm = normalizeCandidateProfile(input.candidateProfile || {})
  if (input.resumeText?.trim()) {
    const extracted = extractCandidateProfileHeuristic(input.resumeText)
    const merged = mergeProfiles(extracted, fromForm.fullName ? fromForm : null)

    if (!merged.fullName.trim()) {
      const firstLine =
        input.resumeText
          .split(/\r?\n/)
          .map((l) => l.replace(/^#+\s*/, '').trim())
          .find((l) => l.length >= 3 && l.length <= 80 && !/@/.test(l) && !/^https?:/i.test(l)) || ''
      if (firstLine) merged.fullName = firstLine.split(/[|·•]/)[0].trim()
    }

    return merged
  }
  return fromForm
}

/** @deprecated use resolveCandidateProfileSync — kept for callers */
export async function resolveCandidateProfile(input: {
  resumeText?: string
  candidateProfile?: Partial<CandidateProfile> | null
}): Promise<CandidateProfile> {
  return resolveCandidateProfileSync(input)
}

/** @deprecated heuristic-only now */
export async function extractCandidateProfile(resumeText?: string): Promise<CandidateProfile> {
  return extractCandidateProfileHeuristic(resumeText || '')
}

export function mergeProfiles(
  base: CandidateProfile,
  override?: Partial<CandidateProfile> | null,
): CandidateProfile {
  if (!override) return base
  return normalizeCandidateProfile({
    fullName: override.fullName || base.fullName,
    email: override.email || base.email,
    phone: override.phone || base.phone,
    location: override.location || base.location,
    linkedin: override.linkedin || base.linkedin,
    website: override.website || base.website,
    summary: override.summary || base.summary,
    skills: override.skills?.length ? override.skills : base.skills,
    experiences: override.experiences?.length ? override.experiences : base.experiences,
    projects: override.projects?.length ? override.projects : base.projects,
    education: override.education || base.education,
  })
}
