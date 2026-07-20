import { createResumePdfDocument } from '../../utils/pdf/ResumePdfDocument'
import { createCoverLetterPdfDocument } from '../../utils/pdf/CoverLetterPdfDocument'
import { renderPdfToBuffer, renderPdfToNodeStream } from '../../utils/pdf/renderPdf'
import type { PdfDownloadPayload } from '../../utils/pdf/types'
import { withLayoutState } from '~/shared/pdf/schema'
import { sendStream } from 'h3'

function sanitizeFilename(value?: string) {
  const base = String(value || 'resume')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return base.endsWith('.pdf') ? base : `${base || 'resume'}.pdf`
}

/**
 * Server-side PDF generation via @react-pdf/renderer.
 * Reads templateSlug + sectionsOrder from the body so the download matches
 * the vue-pdf preview canvas exactly.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<PdfDownloadPayload>(event)

  if (!body?.resume || typeof body.resume !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Resume payload is required.',
    })
  }

  const kind = body.kind === 'cover_letter' ? 'cover_letter' : 'resume'

  const resume = withLayoutState({
    ...body.resume,
    templateSlug: body.templateSlug || body.resume.templateSlug || body.resume.templateId,
    templateId:
      body.templateSlug ||
      body.resume.templateId ||
      body.resume.templateSlug ||
      (kind === 'cover_letter' ? 'cl-standard' : 'the-distinguished'),
    sectionsOrder: body.sectionsOrder || body.resume.sectionsOrder,
  })

  // Prefer the explicit coverLetter payload (live editor) over nested resume.coverLetter.
  const coverLetterPayload = body.coverLetter || resume.coverLetter
  if (kind === 'cover_letter' && coverLetterPayload) {
    resume.coverLetter = coverLetterPayload
  }

  const filename = sanitizeFilename(
    body.filename ||
      (kind === 'cover_letter'
        ? `${resume.personalInfo?.fullName || resume.name || 'cover'}-cover-letter`
        : `${resume.personalInfo?.fullName || resume.name || 'resume'}-resume`),
  )

  const document =
    kind === 'cover_letter'
      ? createCoverLetterPdfDocument(resume, coverLetterPayload)
      : createResumePdfDocument(resume)

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  setHeader(event, 'Cache-Control', 'no-store')

  const preferStream = String(getQuery(event).stream || '') === '1'

  if (preferStream) {
    const stream = await renderPdfToNodeStream(document)
    return sendStream(event, stream)
  }

  const buffer = await renderPdfToBuffer(document)
  setHeader(event, 'Content-Length', buffer.length as any)
  return buffer
})
