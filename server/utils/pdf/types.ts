import type {
  BuilderCoverLetter,
  BuilderResumeData,
  BuilderSectionId,
} from '~/shared/types/builder'

export type PdfDocumentKind = 'resume' | 'cover_letter'

export interface PdfDownloadPayload {
  kind?: PdfDocumentKind
  /** Stable filename stem without .pdf */
  filename?: string
  resume: BuilderResumeData
  /** Optional override when kind is cover_letter */
  coverLetter?: BuilderCoverLetter
  /**
   * Explicit template identity from the client canvas.
   * Overrides resume.templateSlug / resume.templateId when present.
   */
  templateSlug?: string
  /**
   * Explicit section draw order from the client canvas.
   * Overrides resume.sectionsOrder when present.
   */
  sectionsOrder?: BuilderSectionId[]
}

// Re-export shared helpers so existing server imports keep working.
export {
  stripHtmlToPlain,
  htmlToBlocks,
  htmlToInlineRuns,
  formatDateRange,
  type PdfTextBlock,
} from '~/shared/pdf/text'

export {
  layoutFamily,
  layoutVariety,
  resolveTemplateSlug,
  normalizeSectionsOrder,
} from '~/shared/pdf/schema'
