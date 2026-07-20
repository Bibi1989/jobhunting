export interface Job {
  id?: string
  title: string
  company?: string
  location: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  url: string
  description?: string
  descriptionSource?: string
  sourceUrl?: string
}

export interface TailoredMaterials {
  resume: string
  coverLetter: string
}

export interface UserDocumentSummary {
  id: string
  docType: 'resume' | 'cover_letter'
  originalName: string
  mimeType: string
  contentText: string
  createdAt: string
  updatedAt: string
}

export type ApplicationFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'boolean'
  | 'number'
  | 'url'
  | 'email'
  | 'file'
  | 'unknown'

export interface ApplicationQuestion {
  id: string
  label: string
  type: ApplicationFieldType
  required?: boolean
  options?: string[]
  helpText?: string
  section?: string
  answer?: string
  notes?: string
}

export interface ApplicationFormExtract {
  sourceUrl: string
  finalUrl: string
  title?: string
  questions: ApplicationQuestion[]
  notes?: string
  extractedFrom: 'html' | 'inferred' | 'mixed'
}
