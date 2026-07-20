export interface CandidateExperience {
  company: string
  title: string
  location?: string
  startDate?: string
  endDate?: string
  bullets: string[]
}

export interface CandidateProject {
  name: string
  bullets: string[]
}

export interface CandidateProfile {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin?: string
  website?: string
  summary?: string
  skills: string[]
  experiences: CandidateExperience[]
  projects?: CandidateProject[]
  education?: string
}

export const EMPTY_CANDIDATE_PROFILE: CandidateProfile = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  summary: '',
  skills: [],
  experiences: [],
  projects: [],
  education: '',
}

export function formatCandidateContactLine(profile: CandidateProfile): string {
  const parts = [
    profile.location,
    profile.email,
    profile.phone,
    profile.linkedin,
    profile.website,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
  return parts.join(' · ')
}

export function hasUsableIdentity(profile: Partial<CandidateProfile> | null | undefined): boolean {
  return Boolean(profile?.fullName?.trim() && (profile.email?.trim() || profile.phone?.trim()))
}

/**
 * Force the document header / signature to use the candidate's real identity.
 * Fixes models/templates that copy sample names (e.g. Jordan Ellis).
 */
export function stampCandidateIdentity(markdown: string, profile: CandidateProfile | null | undefined): string {
  if (!markdown?.trim() || !profile?.fullName?.trim()) return markdown

  const name = profile.fullName.trim()
  const contact = formatCandidateContactLine(profile)
  let text = markdown

  // Replace known sample identities and placeholder employers
  text = text
    .replace(/\bJordan Ellis\b/gi, name)
    .replace(/jordan\.ellis@email\.com/gi, profile.email || '')
    .replace(/\(415\)\s*555-0142/g, profile.phone || '')
    .replace(/linkedin\.com\/in\/jordanellis/gi, profile.linkedin || profile.website || '')
    .replace(/github\.com\/jordanellis/gi, profile.website || '')
    .replace(/San Francisco,\s*CA(?=\s*·|\s*$|,)/gi, profile.location || 'San Francisco, CA')
    .replace(/\bNorthline Systems\b/gi, profile.experiences[0]?.company || 'Northline Systems')
    .replace(/\bCascade Labs\b/gi, profile.experiences[1]?.company || profile.experiences[0]?.company || 'Cascade Labs')
    .replace(/\[FULL NAME\]/gi, name)
    .replace(/\[EMAIL\]/gi, profile.email || '[EMAIL]')
    .replace(/\[PHONE\]/gi, profile.phone || '[PHONE]')
    .replace(/\[LOCATION\]/gi, profile.location || '[LOCATION]')

  const lines = text.split('\n')
  let nameIdx = lines.findIndex((line) => /^#\s+/.test(line.trim()))
  if (nameIdx < 0) {
    lines.unshift(`# ${name}`)
    if (contact) lines.splice(1, 0, contact)
    text = lines.join('\n')
  } else {
    const rest = lines[nameIdx].replace(/^#\s+/, '').trim()
    if (rest.includes('|')) {
      const titlePart = rest.split('|').slice(1).join('|').trim()
      lines[nameIdx] = `# ${name}${titlePart ? ` | ${titlePart}` : ''}`
    } else if (!/^#\s+/.test(lines[nameIdx]) || !lines[nameIdx].includes(name)) {
      lines[nameIdx] = `# ${name}`
    } else {
      lines[nameIdx] = `# ${name}`
    }

    if (contact) {
      let contactIdx = -1
      for (let i = nameIdx; i < Math.min(lines.length, nameIdx + 8); i++) {
        const line = lines[i] || ''
        if (/@/.test(line) || /\d{3}.*\d{3}/.test(line) || /linkedin\.com/i.test(line) || /·/.test(line)) {
          contactIdx = i
          break
        }
      }
      if (contactIdx >= 0) lines[contactIdx] = contact
      else lines.splice(nameIdx + 1, 0, contact)
    }

    text = lines.join('\n')
  }

  text = text.replace(
    /(Sincerely|Best regards|Kind regards|Respectfully),?\s*\n+[^\n]+/i,
    `$1,\n${name}`,
  )

  return text
}

export function isCandidateProfileComplete(profile: Partial<CandidateProfile> | null | undefined): boolean {
  if (!profile) return false
  return Boolean(
    profile.fullName?.trim() &&
      profile.email?.trim() &&
      profile.phone?.trim() &&
      profile.location?.trim() &&
      (profile.skills?.length || (profile as { skillsText?: string }).skillsText) &&
      (profile.experiences?.length ||
        (profile as { experienceText?: string }).experienceText?.trim()),
  )
}

export function normalizeCandidateProfile(
  input: Partial<CandidateProfile> & { skillsText?: string; experienceText?: string } = {},
): CandidateProfile {
  const skills =
    input.skills?.length
      ? input.skills.map((s) => String(s).trim()).filter(Boolean)
      : String(input.skillsText || '')
          .split(/[,·|;]/)
          .map((s) => s.trim())
          .filter(Boolean)

  let experiences: CandidateExperience[] = (input.experiences || [])
    .map((exp) => ({
      company: String(exp.company || '').trim(),
      title: String(exp.title || '').trim(),
      location: String(exp.location || '').trim(),
      startDate: String(exp.startDate || '').trim(),
      endDate: String(exp.endDate || '').trim(),
      bullets: ensureBullets(exp.bullets || []),
    }))
    .filter((exp) => exp.company || exp.title || exp.bullets.length)

  if (!experiences.length && input.experienceText?.trim()) {
    experiences = parseExperienceText(input.experienceText)
  }

  return {
    fullName: String(input.fullName || '').trim(),
    email: String(input.email || '').trim(),
    phone: String(input.phone || '').trim(),
    location: String(input.location || '').trim(),
    linkedin: String(input.linkedin || '').trim(),
    website: String(input.website || '').trim(),
    summary: String(input.summary || '').trim(),
    skills,
    experiences,
    projects: (input.projects || [])
      .map((p) => ({
        name: String(p.name || '').trim(),
        bullets: ensureBullets(p.bullets || []),
      }))
      .filter((p) => p.name || p.bullets.length),
    education: String(input.education || '').trim(),
  }
}

function parseExperienceText(text: string): CandidateExperience[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const experiences: CandidateExperience[] = []
  let current: CandidateExperience | null = null

  for (const line of lines) {
    const cleaned = line.replace(/^[-*•]\s*/, '').trim()

    if (/^[-*•]/.test(line) && current) {
      current.bullets.push(cleaned)
      continue
    }

    // New role header: "Company, Title (dates)" or "Company - Title"
    if (
      /[,|–-]/.test(line) ||
      /\(\d{4}/.test(line) ||
      /\b(present|current)\b/i.test(line)
    ) {
      if (current && (current.company || current.title || current.bullets.length)) {
        experiences.push(current)
      }
      const dateMatch = line.match(/\(([^)]+)\)\s*$/)
      const withoutDates = line.replace(/\(([^)]+)\)\s*$/, '').trim()
      const parts = withoutDates.split(/[,|–-]/).map((p) => p.trim()).filter(Boolean)
      const dateParts = (dateMatch?.[1] || '').split(/[–—,to-]+/).map((p) => p.trim())
      current = {
        company: parts[0] || 'Employer',
        title: parts.slice(1).join(', ') || 'Role',
        location: '',
        startDate: dateParts[0] || '',
        endDate: dateParts[1] || '',
        bullets: [],
      }
      continue
    }

    if (!current) {
      current = {
        company: 'Your experience',
        title: 'Role',
        location: '',
        startDate: '',
        endDate: '',
        bullets: [cleaned],
      }
    } else {
      current.bullets.push(cleaned)
    }
  }

  if (current && (current.company || current.title || current.bullets.length)) {
    experiences.push(current)
  }

  return experiences.map((exp) => ({
    ...exp,
    bullets: ensureBullets(exp.bullets.length ? exp.bullets : ['Contributed to team goals']),
  }))
}

export function ensureBullets(items: string[]): string[] {
  return items
    .map((item) =>
      String(item || '')
        .replace(/^[-*•\d.)\s]+/, '')
        .trim(),
    )
    .filter(Boolean)
}

/** Force experience body text under each role into Markdown bullets. */
export function enforceExperienceBullets(markdown: string): string {
  const lines = markdown.split('\n')
  const out: string[] = []
  let inExperience = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const lower = trimmed.toLowerCase()

    if (/^##\s+/.test(trimmed) || /^\*\*[^*]*(experience|employment|work history)/i.test(trimmed)) {
      inExperience = /experience|work history|employment|leadership experience|engineering experience/i.test(
        lower,
      )
      out.push(line)
      continue
    }

    if (/^#\s+/.test(trimmed) && !/^##/.test(trimmed)) {
      inExperience = false
      out.push(line)
      continue
    }

    if (
      inExperience &&
      trimmed &&
      !/^#{1,3}\s/.test(trimmed) &&
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('-') &&
      !trimmed.startsWith('**') &&
      !/^(dear |sincerely|hiring manager|duties)/i.test(trimmed)
    ) {
      // Split dense paragraphs into bullet-sized chunks when needed
      if (trimmed.length > 140 && /[.;]/.test(trimmed)) {
        const parts = trimmed
          .split(/(?<=[.;])\s+/)
          .map((p) => p.trim())
          .filter(Boolean)
        for (const part of parts) {
          out.push(`- ${part.replace(/^[-*•]\s*/, '')}`)
        }
      } else {
        out.push(`- ${trimmed.replace(/^[-*•]\s*/, '')}`)
      }
      continue
    }

    // Normalize already-bulleted lines
    if (inExperience && /^[-*•]\s+/.test(trimmed)) {
      out.push(`- ${trimmed.replace(/^[-*•]\s*/, '')}`)
      continue
    }

    out.push(line)
  }

  return out.join('\n')
}
