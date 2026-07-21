import { query } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')

  // Verify ownership of the document first
  const docCheck = await query(
    `SELECT id FROM user_documents WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  )
  if (!docCheck.rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  const result = await query(
    `SELECT id, version_label, created_at, content_text
     FROM user_document_versions
     WHERE document_id = $1
     ORDER BY created_at DESC`,
    [id]
  )

  return result.rows.map((row) => ({
    id: row.id,
    label: row.version_label,
    createdAt: row.created_at,
    content: JSON.parse(row.content_text)
  }))
})
