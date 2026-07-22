export interface ApplyEmailTemplate {
  id: string
  name: string
  jobTitle: string
  jobDescription: string
  subject: string
  bodyText: string
  attachResume: boolean
  attachCoverLetter: boolean
  resumeSource: 'builder' | 'upload'
  coverLetterSource: 'builder' | 'upload'
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'jobflow_apply_email_templates'

function storageKey(userId?: string | null) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY
}

export function loadApplyEmailTemplates(userId?: string | null): ApplyEmailTemplate[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as ApplyEmailTemplate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveApplyEmailTemplates(templates: ApplyEmailTemplate[], userId?: string | null) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(storageKey(userId), JSON.stringify(templates))
}

export function upsertApplyEmailTemplate(
  input: Omit<ApplyEmailTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  userId?: string | null,
): ApplyEmailTemplate[] {
  const list = loadApplyEmailTemplates(userId)
  const now = new Date().toISOString()
  const existingIdx = input.id ? list.findIndex((t) => t.id === input.id) : -1
  const next: ApplyEmailTemplate = {
    id: input.id || crypto.randomUUID(),
    name: input.name.trim() || 'Untitled template',
    jobTitle: input.jobTitle,
    jobDescription: input.jobDescription,
    subject: input.subject,
    bodyText: input.bodyText,
    attachResume: input.attachResume,
    attachCoverLetter: input.attachCoverLetter,
    resumeSource: input.resumeSource,
    coverLetterSource: input.coverLetterSource,
    createdAt: existingIdx >= 0 ? list[existingIdx]!.createdAt : now,
    updatedAt: now,
  }
  if (existingIdx >= 0) list[existingIdx] = next
  else list.unshift(next)
  saveApplyEmailTemplates(list.slice(0, 20), userId)
  return list.slice(0, 20)
}

export function deleteApplyEmailTemplate(id: string, userId?: string | null): ApplyEmailTemplate[] {
  const list = loadApplyEmailTemplates(userId).filter((t) => t.id !== id)
  saveApplyEmailTemplates(list, userId)
  return list
}
