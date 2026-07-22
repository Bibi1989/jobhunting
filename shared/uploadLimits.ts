/** Product limit for resume / cover letter uploads (PDF pages or text estimate). */
export const MAX_UPLOAD_PAGES = 3

/** Rough words-per-page when PDF page metadata is unavailable (DOCX/TXT). */
export const WORDS_PER_PAGE_ESTIMATE = 500

export function estimatePagesFromText(text: string): number {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  if (words === 0) return 1
  return Math.max(1, Math.ceil(words / WORDS_PER_PAGE_ESTIMATE))
}

export const UPLOAD_PAGE_LIMIT_HINT = `Maximum ${MAX_UPLOAD_PAGES} pages per file`
