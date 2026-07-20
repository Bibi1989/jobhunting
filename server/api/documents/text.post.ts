import { saveUserDocument, type DocumentType } from '../../utils/documents'
import { replaceEmDashes } from '../../../shared/samples/professionalDocuments'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    type?: DocumentType
    contentText?: string
    originalName?: string
  }>(event)

  const docType = body?.type
  if (docType !== 'resume' && docType !== 'cover_letter') {
    throw createError({
      statusCode: 400,
      statusMessage: 'type must be resume or cover_letter',
    })
  }

  const contentText = replaceEmDashes((body?.contentText || '').trim())
  if (contentText.length < 20) {
    throw createError({
      statusCode: 400,
      statusMessage: 'contentText must be at least 20 characters',
    })
  }

  const originalName =
    body.originalName?.trim() ||
    (docType === 'resume' ? 'tailored-resume.md' : 'tailored-cover-letter.md')

  const buffer = Buffer.from(contentText, 'utf8')
  const document = await saveUserDocument({
    docType,
    originalName,
    mimeType: 'text/markdown',
    contentText,
    buffer,
  })

  return { document }
})
