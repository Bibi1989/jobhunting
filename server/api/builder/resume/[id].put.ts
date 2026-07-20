import { query } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'
import type { BuilderResumeData } from '~/shared/types/builder'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<BuilderResumeData & { documentKind?: 'resume' | 'cover_letter' }>(event)
  const { documentKind: _omit, ...data } = body
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

  return { success: true }
})
