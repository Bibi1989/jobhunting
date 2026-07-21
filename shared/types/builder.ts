export interface BuilderPersonalInfo {
  fullName: string
  jobTitle?: string
  location: string
  email: string
  phone: string
  summary: string
  linkedin?: string
  github?: string
  portfolio?: string
  targetRole?: string
  commandPrompt?: string
}

export interface BuilderExperience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  isCurrent?: boolean
  description: string
  companyWebsite?: string
  companyWebsiteName?: string
  targetRole?: string
  commandPrompt?: string
}

export interface BuilderEducation {
  id: string
  degree: string
  school: string
  location: string
  graduationDate: string
  description?: string
}

export interface BuilderSkill {
  id: string
  name: string
  level?: string
}

export interface BuilderProject {
  id: string
  title: string
  organization?: string
  location?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  description?: string
  projectDescription?: string
  linkUrl?: string
  linkName?: string
  targetRole?: string
  commandPrompt?: string
}

export interface BuilderAchievement {
  id: string
  title: string
  issuer?: string
  date?: string
  description?: string
}

export interface BuilderCustomItem {
  id: string
  title: string
  subtitle?: string
  date?: string
  description?: string
}

export interface BuilderCustomSection {
  id: string
  title: string
  items: BuilderCustomItem[]
}

export interface BuilderCoverLetter {
  jobDescription?: string
  companyName?: string
  hiringManager?: string
  tone: 'professional' | 'enthusiastic' | 'confident'
  /** Extra instructions for AI Enhance (e.g. keep to one page) */
  additionalInstructions?: string
  content: string
}

/** Ordered content blocks drawn by both the preview canvas and PDF download. */
export type BuilderSectionId =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'achievements'
  | `custom:${string}`

export interface BuilderResumeData {
  name: string
  /** Legacy template identity — kept in sync with templateSlug. */
  templateId: string
  /** Canonical template identity tag used by the PDF layout registry. */
  templateSlug?: string
  /**
   * User-controlled draw order for resume sections.
   * Both vue-pdf preview and Nitro react-pdf iterate this array.
   */
  sectionsOrder?: BuilderSectionId[]
  themeColor?: string
  language?: 'en' | 'de' | 'fr' | 'es'
  /** Optional JD used for AI draft / ATS (JD and/or resume is enough to draft). */
  targetJobDescription?: string
  /** Extra instructions for AI resume draft (e.g. emphasize leadership). */
  additionalInstructions?: string
  personalInfo: BuilderPersonalInfo
  experience: BuilderExperience[]
  education: BuilderEducation[]
  skills: BuilderSkill[]
  projects: BuilderProject[]
  achievements: BuilderAchievement[]
  customSections: BuilderCustomSection[]
  coverLetter?: BuilderCoverLetter
}
