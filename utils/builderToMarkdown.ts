import type { BuilderResumeData } from '~/shared/types/builder'
import { formatResumeDateRange, sanitizeRichTextHtml } from '~/utils/richText'

function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

/** Strip HTML to plain text suitable for ResumeThemeRenderer markdown. */
export function htmlToPlainText(html?: string | null): string {
  if (!html) return ''
  let text = sanitizeRichTextHtml(html)
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
  return decodeEntities(text)
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Prefer list items; fall back to non-empty lines. */
export function htmlToBulletLines(html?: string | null): string[] {
  if (!html) return []
  const cleaned = sanitizeRichTextHtml(html)
  const fromLis = [...cleaned.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
    htmlToPlainText(m[1]).replace(/^[-*•●▪◦]\s*/, '').trim(),
  ).filter(Boolean)

  if (fromLis.length) return fromLis

  return htmlToPlainText(cleaned)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•●▪◦]\s*/, '').trim())
    .filter(Boolean)
}

/**
 * Convert builder structured resume data into the markdown shape
 * ResumeThemeRenderer already knows how to parse.
 */
export function builderResumeToMarkdown(data: BuilderResumeData): string {
  const info = data.personalInfo || ({} as BuilderResumeData['personalInfo'])
  const lines: string[] = []

  lines.push(`# ${info.fullName || 'Your Name'}`)
  if (info.jobTitle) lines.push(info.jobTitle)

  const contact = [
    info.location,
    info.email,
    info.phone,
    info.linkedin,
    info.portfolio,
    info.github,
  ].filter(Boolean)
  if (contact.length) lines.push(contact.join(' · '))

  const summary = htmlToPlainText(info.summary)
  if (summary) {
    lines.push('', '## Summary', summary)
  }

  const skillNames = (data.skills || []).map((s) => s.name?.trim()).filter(Boolean) as string[]
  if (skillNames.length) {
    lines.push('', '## Skills')
    lines.push(skillNames.join(' · '))
  }

  if (data.experience?.length) {
    lines.push('', '## Experience')
    for (const exp of data.experience) {
      const heading = [exp.title || 'Role', exp.company].filter(Boolean).join(', ')
      lines.push(`### ${heading}`)
      const dates = formatResumeDateRange(exp.startDate, exp.endDate, exp.isCurrent)
      const metaParts = [exp.location, dates].filter(Boolean)
      if (metaParts.length) lines.push(`*${metaParts.join(' · ')}*`)
      for (const bullet of htmlToBulletLines(exp.description)) {
        lines.push(`- ${bullet}`)
      }
      lines.push('')
    }
  }

  if (data.projects?.length) {
    lines.push('', '## Projects')
    for (const proj of data.projects) {
      lines.push(`### ${proj.title || 'Project'}`)
      for (const bullet of htmlToBulletLines(proj.description)) {
        lines.push(`- ${bullet}`)
      }
      lines.push('')
    }
  }

  const education = (data.education || []).filter((edu) => {
    const degree = (edu.degree || '').trim()
    const school = (edu.school || '').trim()
    return Boolean(school || (degree && degree.toLowerCase() !== 'degree'))
  })
  if (education.length) {
    lines.push('', '## Education')
    for (const edu of education) {
      const degree = (edu.degree || '').trim()
      const school = (edu.school || '').trim()
      const heading = [degree && degree.toLowerCase() !== 'degree' ? degree : '', school]
        .filter(Boolean)
        .join(', ')
      lines.push(`### ${heading || 'Education'}`)
      const metaParts = [edu.location, formatMonthish(edu.graduationDate)].filter(Boolean)
      if (metaParts.length) lines.push(`*${metaParts.join(' · ')}*`)
      for (const bullet of htmlToBulletLines(edu.description)) {
        lines.push(`- ${bullet}`)
      }
      lines.push('')
    }
  }

  if (data.achievements?.length) {
    lines.push('', '## Credentials')
    for (const ach of data.achievements) {
      const label = [ach.title, ach.issuer, formatMonthish(ach.date)].filter(Boolean).join(' · ')
      if (label) lines.push(`- ${label}`)
      for (const bullet of htmlToBulletLines(ach.description)) {
        lines.push(`- ${bullet}`)
      }
    }
  }

  for (const section of data.customSections || []) {
    const title = (section.title || '').trim()
    if (!title || !section.items?.length) continue
    lines.push('', `## ${title}`)
    for (const item of section.items) {
      const itemTitle = (item.title || '').trim()
      if (!itemTitle) continue
      lines.push(`### ${itemTitle}`)
      if (item.subtitle || item.date) {
        const meta = [item.subtitle, formatMonthish(item.date)].filter(Boolean).join(' · ')
        if (meta) lines.push(`*${meta}*`)
      }
      for (const bullet of htmlToBulletLines(item.description)) {
        lines.push(`- ${bullet}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n').trim()
}

function formatMonthish(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
