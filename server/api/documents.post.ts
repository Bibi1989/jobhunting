import {
  assertAllowedUpload,
  extractTextFromUpload,
  saveUserDocument,
  type DocumentType,
} from '../utils/documents'

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event)
    if (!form?.length) {
      throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }

    const typePart = form.find((p) => p.name === 'type')
    const filePart = form.find((p) => p.name === 'file' && p.filename)

    const docType = (typePart?.data?.toString('utf8') || '') as DocumentType
    if (docType !== 'resume' && docType !== 'cover_letter') {
      throw createError({
        statusCode: 400,
        statusMessage: 'type must be resume or cover_letter',
      })
    }

    if (!filePart?.data || !filePart.filename) {
      throw createError({ statusCode: 400, statusMessage: 'file is required' })
    }

    const mimeType = filePart.type || 'application/octet-stream'
    assertAllowedUpload(mimeType, filePart.filename)

    const buffer = Buffer.from(filePart.data)
    const contentText = await extractTextFromUpload(buffer, mimeType, filePart.filename)

    if (!contentText || contentText.length < 20) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Could not extract enough text from the uploaded file',
      })
    }

    const document = await saveUserDocument({
      docType,
      originalName: filePart.filename,
      mimeType,
      contentText,
      buffer,
    })

    return { document }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Document upload failed'
    console.error('Document upload failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: message,
    })
  }
})
