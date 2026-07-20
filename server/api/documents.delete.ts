import { requireUser } from '~/server/utils/auth'
import { deleteUserDocument, type DocumentType } from '../utils/documents'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const queryParams = getQuery(event)
  const body = (await readBody<{ type?: DocumentType }>(event).catch(() => null)) || {}

  const docType = (body.type || queryParams.type || '') as DocumentType
  if (docType !== 'resume' && docType !== 'cover_letter') {
    throw createError({
      statusCode: 400,
      statusMessage: 'type must be resume or cover_letter',
    })
  }

  return deleteUserDocument(user.id, docType)
})
