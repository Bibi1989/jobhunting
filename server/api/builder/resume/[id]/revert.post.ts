import { query } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ versionId: string }>(event)
  const { versionId } = body || {}

  if (!versionId) {
    throw createError({ statusCode: 400, statusMessage: 'versionId is required' })
  }

  // Verify ownership of the document first
  const docCheck = await query(
    `SELECT id FROM user_documents WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  )
  if (!docCheck.rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  // Get the version details
  const versionCheck = await query(
    `SELECT content_text FROM user_document_versions
     WHERE id = $1 AND document_id = $2`,
    [versionId, id]
  )
  if (!versionCheck.rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Version not found' })
  }

  const contentText = versionCheck.rows[0].content_text

  // Revert the document to this version
  await query(
    `UPDATE user_documents
     SET content_text = $1, updated_at = NOW()
     WHERE id = $2`,
    [contentText, id]
  )

  return { success: true, content: JSON.parse(contentText) }
})
