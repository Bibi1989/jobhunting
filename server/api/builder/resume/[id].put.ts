import { query } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'
import type { BuilderResumeData } from '~/shared/types/builder'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<BuilderResumeData & { documentKind?: 'resume' | 'cover_letter'; versionLabel?: string }>(event)
  const { documentKind: _omit, versionLabel, ...data } = body
  const content = JSON.stringify(data)
  const name = body.name || 'Untitled Document'

  const result = await query(
    `UPDATE user_documents
     SET original_name = $1, content_text = $2, updated_at = NOW()
     WHERE id = $3
       AND user_id = $4
       AND mime_type = 'application/json'
       AND doc_type IN ('resume', 'cover_letter')
     RETURNING id`,
    [name, content, id, user.id],
  )

  if (!result.rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  // Find the latest version's content to avoid duplicate versions
  const latestResult = await query(
    `SELECT content_text FROM user_document_versions
     WHERE document_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [id]
  )

  const isDifferent = !latestResult.rows.length || latestResult.rows[0].content_text !== content

  if (isDifferent) {
    await query(
      `INSERT INTO user_document_versions (document_id, content_text, version_label)
       VALUES ($1, $2, $3)`,
      [id, content, versionLabel || 'Manual Edit']
    )
  }

  return { success: true }
})
