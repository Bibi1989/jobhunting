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
  /** Base64 data URL for header photo (optional; hidden unless design.showPhoto). */
  photoDataUrl?: string
}

export type BuilderFontFamily = string
export type BuilderTextAlign = 'left' | 'center' | 'right'
/** @deprecated use BuilderTextAlign */
export type BuilderHeaderAlign = BuilderTextAlign
export type BuilderDetailsLayout = 'stacked' | 'inline' | 'columns'
export type BuilderDetailsSeparator = 'icon' | 'bullet' | 'bar'
export type BuilderIconStyle =
  | 'plain'
  | 'filled-circle'
  | 'filled-rounded'
  | 'filled-square'
  | 'outline-circle'
  | 'outline-rounded'
  | 'outline-square'
export type BuilderPhotoShape = 'circle' | 'square' | 'rounded'

export interface BuilderAccentTargets {
  name?: boolean
  jobTitle?: boolean
  headings?: boolean
  headingsLine?: boolean
  headerBackground?: boolean
  headerIcons?: boolean
  dotsBarsBubbles?: boolean
  dates?: boolean
  entrySubtitle?: boolean
  linkIcons?: boolean
}

/** User design overrides applied on top of the selected template profile. */
export interface BuilderDesignSettings {
  fontFamily?: BuilderFontFamily
  /** Accent swatch; null/empty = template default. */
  accentColor?: string | null
  accentTargets?: BuilderAccentTargets
  backgroundColor?: string | null
  /** Header band / chrome background color. */
  headerColor?: string | null
  headerBackgroundColor?: string | null
  /** Name, job title, and contact line color in the header. */
  headerTextColor?: string | null
  sectionTitleColor?: string | null
  bodyTextColor?: string | null
  lineBorderColor?: string | null
  headerAlign?: BuilderTextAlign
  sectionTitleAlign?: BuilderTextAlign
  detailsLayout?: BuilderDetailsLayout
  detailsSeparator?: BuilderDetailsSeparator
  iconStyle?: BuilderIconStyle
  nameFontSize?: number
  jobTitleFontSize?: number
  sectionTitleFontSize?: number
  /** Body text size in pt (also syncs with top-level fontSize when set). */
  bodyFontSize?: number
  /** When false/undefined, photo is not drawn even if photoDataUrl exists. */
  showPhoto?: boolean
  photoShape?: BuilderPhotoShape
  /** Corner radius % of half-size when photoShape is `rounded` (0–100). */
  photoBorderRadius?: number
  /** Profile photo size in PDF points (default 56). */
  photoSize?: number
}

export const DEFAULT_ACCENT_TARGETS: Required<BuilderAccentTargets> = {
  name: true,
  jobTitle: true,
  headings: true,
  headingsLine: true,
  headerBackground: false,
  headerIcons: false,
  dotsBarsBubbles: false,
  dates: false,
  entrySubtitle: false,
  linkIcons: false,
}

export const DEFAULT_DESIGN_SETTINGS: BuilderDesignSettings = {
  fontFamily: 'Inter',
  accentColor: null,
  accentTargets: { ...DEFAULT_ACCENT_TARGETS },
  backgroundColor: null,
  headerColor: null,
  headerBackgroundColor: null,
  headerTextColor: null,
  sectionTitleColor: null,
  bodyTextColor: null,
  lineBorderColor: null,
  headerAlign: 'left',
  sectionTitleAlign: 'left',
  detailsLayout: 'inline',
  detailsSeparator: 'bullet',
  iconStyle: 'plain',
  nameFontSize: 22,
  jobTitleFontSize: 11,
  sectionTitleFontSize: 11,
  bodyFontSize: undefined,
  showPhoto: false,
  photoShape: 'circle',
  photoBorderRadius: 25,
  photoSize: 56,
}

/** Shared circular swatches for Colors + Accent (screenshot palette). */
export const DESIGN_COLOR_SWATCHES = [
  null,
  '#1e293b',
  '#312e81',
  '#0f766e',
  '#14b8a6',
  '#06b6d4',
  '#0284c7',
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#7c3aed',
  '#9f1239',
  '#e11d48',
  '#db2777',
  '#f43f5e',
] as const

/** @deprecated use DESIGN_COLOR_SWATCHES */
export const DESIGN_ACCENT_SWATCHES = DESIGN_COLOR_SWATCHES

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
  /** Starred in the builder workspace (embedded cover letters). */
  isFavorite?: boolean
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
  spacingPreset?: 'ats-stable' | 'compact' | 'balanced'
  /** Body font size in points (overrides spacing preset). */
  fontSize?: number
  /** Body line height multiplier (overrides spacing preset). */
  lineHeight?: number
  /** Left/right page margin in points. */
  marginHorizontal?: number
  /** Top/bottom page margin in points. */
  marginVertical?: number
  /** Visual design overrides (colors, fonts, header, photo). */
  design?: BuilderDesignSettings
  /** Optional JD used for AI draft / ATS (JD and/or resume is enough to draft). */
  targetJobDescription?: string
  /** Extra instructions for AI resume draft (e.g. emphasize leadership). */
  additionalInstructions?: string
  /**
   * When true, AI draft / enhance / ATS fix may invent or emphasize quantitative metrics.
   * Default false — many roles do not need numbers in experience bullets.
   */
  useMetrics?: boolean
  personalInfo: BuilderPersonalInfo
  experience: BuilderExperience[]
  education: BuilderEducation[]
  skills: BuilderSkill[]
  projects: BuilderProject[]
  achievements: BuilderAchievement[]
  customSections: BuilderCustomSection[]
  coverLetter?: BuilderCoverLetter
}
