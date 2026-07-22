import { createResumePdfDocument } from '../../utils/pdf/ResumePdfDocument'
import { createCoverLetterPdfDocument } from '../../utils/pdf/CoverLetterPdfDocument'
import { renderPdfToBuffer } from '../../utils/pdf/renderPdf'
import { withLayoutState } from '~/shared/pdf/schema'
import { sendEmail } from '../../utils/email'
import { withCredits } from '../../utils/withCredits'

type UploadedAttachment = {
  filename?: string
  content?: string
  mimeType?: string
}

function safeFilename(name: string, fallback: string): string {
  return (name || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback
}

function pushUploadedAttachment(
  attachments: Array<{ content: string; filename: string }>,
  file: UploadedAttachment | undefined,
  fallbackName: string,
) {
  const content = String(file?.content || '').trim()
  const filename = safeFilename(String(file?.filename || ''), fallbackName)
  if (!content) {
    throw createError({
      statusCode: 400,
      statusMessage: `Uploaded file "${fallbackName}" is missing or empty.`,
    })
  }
  attachments.push({ content, filename })
}

export default withCredits(async (event) => {
  const body = await readBody<{
    to?: string
    subject?: string
    bodyText?: string
    resume?: any
    coverLetter?: any
    attachResume?: boolean
    attachCoverLetter?: boolean
    resumeSource?: 'builder' | 'upload'
    coverLetterSource?: 'builder' | 'upload'
    uploadedResume?: UploadedAttachment
    uploadedCoverLetter?: UploadedAttachment
  }>(event)

  const to = String(body?.to || '').trim()
  const subject = String(body?.subject || '').trim()
  const bodyText = String(body?.bodyText || '').trim()

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid recipient email (To) is required.' })
  }
  if (!subject) {
    throw createError({ statusCode: 400, statusMessage: 'Subject is required.' })
  }
  if (!bodyText) {
    throw createError({ statusCode: 400, statusMessage: 'Email body is required.' })
  }

  const attachments: Array<{ content: string; filename: string }> = []

  if (body?.attachResume) {
    if (body.resumeSource === 'upload') {
      pushUploadedAttachment(attachments, body.uploadedResume, 'resume.pdf')
    } else {
      if (!body.resume || typeof body.resume !== 'object') {
        throw createError({ statusCode: 400, statusMessage: 'Resume data is required to attach resume.' })
      }
      const resume = withLayoutState({
        ...body.resume,
        templateSlug: body.resume.templateSlug || body.resume.templateId || 'the-distinguished',
        templateId: body.resume.templateId || body.resume.templateSlug || 'the-distinguished',
        sectionsOrder: body.resume.sectionsOrder,
      })
      const document = createResumePdfDocument(resume)
      const buffer = await renderPdfToBuffer(document)
      const base64 = Buffer.from(buffer).toString('base64')
      const filename = safeFilename(
        `${resume.personalInfo?.fullName || resume.name || 'resume'}-resume.pdf`,
        'resume.pdf',
      )
      attachments.push({ content: base64, filename })
    }
  }

  if (body?.attachCoverLetter) {
    if (body.coverLetterSource === 'upload') {
      pushUploadedAttachment(attachments, body.uploadedCoverLetter, 'cover-letter.pdf')
    } else {
      if (!body.resume || typeof body.resume !== 'object') {
        throw createError({ statusCode: 400, statusMessage: 'Resume context is required to attach cover letter.' })
      }
      const resume = withLayoutState({
        ...body.resume,
        templateSlug: body.resume.templateSlug || body.resume.templateId || 'cl-standard',
        templateId: body.resume.templateId || body.resume.templateSlug || 'cl-standard',
        sectionsOrder: body.resume.sectionsOrder,
      })
      const coverLetterPayload = body.coverLetter || resume.coverLetter
      if (!coverLetterPayload?.content) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cover letter content is required when attaching from builder.',
        })
      }
      const document = createCoverLetterPdfDocument(resume, coverLetterPayload)
      const buffer = await renderPdfToBuffer(document)
      const base64 = Buffer.from(buffer).toString('base64')
      const filename = safeFilename(
        `${resume.personalInfo?.fullName || resume.name || 'cover'}-cover-letter.pdf`,
        'cover-letter.pdf',
      )
      attachments.push({ content: base64, filename })
    }
  }

  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const emailResult = await sendEmail({
    to,
    subject,
    text: bodyText,
    replyTo: user.email,
    attachments: attachments.length > 0 ? attachments : undefined,
  })

  if (!emailResult.sent) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to send email: ${emailResult.reason || 'unknown error'}. Check RESEND_API_KEY configuration.`,
    })
  }

  return { success: true }
}, { reason: 'ai_apply_email', requirePro: true, cost: 1 })
