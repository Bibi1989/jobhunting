import { deleteUserDocument, type DocumentType } from '../utils/documents'

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event)
  const body = (await readBody<{ type?: DocumentType }>(event).catch(() => null)) || {}

  const docType = (body.type || queryParams.type || '') as DocumentType
  if (docType !== 'resume' && docType !== 'cover_letter') {
    throw createError({
      statusCode: 400,
      statusMessage: 'type must be resume or cover_letter',
    })
  }

  const result = await deleteUserDocument(docType)
  return result
})
