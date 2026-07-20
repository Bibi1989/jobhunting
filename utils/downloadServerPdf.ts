/**
 * Client helper: POST structured resume JSON (including templateSlug + sectionsOrder)
 * to the Nitro react-pdf endpoint and trigger a browser download.
 */

import type { BuilderResumeData, BuilderSectionId } from '~/shared/types/builder'
import { resolveTemplateSlug, normalizeSectionsOrder, withLayoutState } from '~/shared/pdf/schema'

export interface DownloadServerPdfOptions {
  kind?: 'resume' | 'cover_letter'
  filename?: string
  resume: BuilderResumeData | unknown
  coverLetter?: unknown
  templateSlug?: string
  sectionsOrder?: BuilderSectionId[]
}

export async function downloadServerPdf(options: DownloadServerPdfOptions): Promise<void> {
  const filename = (options.filename || 'resume').replace(/\.pdf$/i, '') + '.pdf'
  const resume = withLayoutState((options.resume || {}) as BuilderResumeData)
  const templateSlug =
    options.templateSlug || resolveTemplateSlug(resume)
  const sectionsOrder =
    options.sectionsOrder ||
    normalizeSectionsOrder(resume.sectionsOrder, resume.customSections || [])

  const response = await fetch('/api/pdf/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/pdf' },
    body: JSON.stringify({
      kind: options.kind || 'resume',
      filename,
      resume: {
        ...resume,
        templateSlug,
        templateId: resume.templateId || templateSlug,
        sectionsOrder,
      },
      coverLetter: options.coverLetter,
      templateSlug,
      sectionsOrder,
    }),
  })

  if (!response.ok) {
    let message = 'PDF export failed.'
    try {
      const err = await response.json()
      message = err?.statusMessage || err?.message || message
    } catch {
      /* keep default */
    }
    throw new Error(message)
  }

  const buffer = await response.arrayBuffer()
  const blob = new Blob([buffer], { type: 'application/pdf' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(href)
}
