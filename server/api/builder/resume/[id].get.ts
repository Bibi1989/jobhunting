import { query } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const id = getRouterParam(event, 'id')

  const result = await query(
    `SELECT content_text, original_name, doc_type
     FROM user_documents
     WHERE id = $1 AND mime_type = 'application/json' AND doc_type IN ('resume', 'cover_letter')`,
    [id],
  )

  if (!result.rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  const data = JSON.parse(result.rows[0].content_text)
  return {
    ...data,
    documentKind: result.rows[0].doc_type,
  }
})
