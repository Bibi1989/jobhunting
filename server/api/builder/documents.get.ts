import { query } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'
import type { BuilderResumeData } from '~/shared/types/builder'

export type BuilderDocumentPreview = {
  kind: 'resume' | 'cover_letter'
  fullName: string
  jobTitle: string
  location: string
  email: string
  phone: string
  summary: string
  experience: Array<{ title: string; company: string; dates: string }>
  skills: string[]
  companyName?: string
  hiringManager?: string
  contentPreview?: string
}

function stripHtml(html?: string | null) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasCoverLetterContent(data: BuilderResumeData) {
  const text = stripHtml(data.coverLetter?.content)
  return text.length > 12 && !/^start typing/i.test(text)
}

function buildResumePreview(data: BuilderResumeData): BuilderDocumentPreview {
  const info = data.personalInfo || ({} as BuilderResumeData['personalInfo'])
  return {
    kind: 'resume',
    fullName: info.fullName || data.name || 'Untitled Resume',
    jobTitle: info.jobTitle || '',
    location: info.location || '',
    email: info.email || '',
    phone: info.phone || '',
    summary: stripHtml(info.summary).slice(0, 220),
    experience: (data.experience || []).slice(0, 3).map((exp) => ({
      title: exp.title || '',
      company: exp.company || '',
      dates: [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate].filter(Boolean).join(' – '),
    })),
    skills: (data.skills || [])
      .map((s) => s.name)
      .filter(Boolean)
      .slice(0, 8),
  }
}

function buildCoverLetterPreview(data: BuilderResumeData): BuilderDocumentPreview {
  const info = data.personalInfo || ({} as BuilderResumeData['personalInfo'])
  const letter = data.coverLetter
  return {
    kind: 'cover_letter',
    fullName: info.fullName || data.name || 'Cover Letter',
    jobTitle: info.jobTitle || '',
    location: info.location || '',
    email: info.email || '',
    phone: info.phone || '',
    summary: '',
    experience: [],
    skills: [],
    companyName: letter?.companyName || '',
    hiringManager: letter?.hiringManager || '',
    contentPreview: stripHtml(letter?.content).slice(0, 480),
  }
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const result = await query(
    `SELECT id, doc_type, original_name, updated_at, content_text
     FROM user_documents
     WHERE mime_type = 'application/json'
       AND user_id = $1
     ORDER BY updated_at DESC`,
    [user.id],
  )

  const documents: Array<{
    id: string
    type: string
    name: string
    updatedAt: string
    templateId: string
    preview: BuilderDocumentPreview | null
  }> = []

  for (const row of result.rows) {
    let templateId = ''
    let parsed: BuilderResumeData | null = null
    try {
      parsed = JSON.parse(row.content_text) as BuilderResumeData
      templateId = parsed.templateId || ''
    } catch {
      /* ignore */
    }

    const isCover = row.doc_type === 'cover_letter'
    documents.push({
      id: row.id,
      type: row.doc_type,
      name: row.original_name,
      updatedAt: row.updated_at,
      templateId,
      preview: parsed
        ? isCover
          ? buildCoverLetterPreview(parsed)
          : buildResumePreview(parsed)
        : null,
    })

    // Resumes that also store a cover letter should appear as a separate project card
    if (row.doc_type === 'resume' && parsed && hasCoverLetterContent(parsed)) {
      const company = parsed.coverLetter?.companyName?.trim()
      documents.push({
        id: row.id,
        type: 'cover_letter',
        name: company
          ? `Cover Letter · ${company}`
          : `${row.original_name.replace(/\s+resume$/i, '').trim() || row.original_name} · Cover Letter`,
        updatedAt: row.updated_at,
        templateId,
        preview: buildCoverLetterPreview(parsed),
      })
    }
  }

  return documents
})
