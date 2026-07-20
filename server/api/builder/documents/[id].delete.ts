import { query } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'
import type { BuilderResumeData } from '~/shared/types/builder'

/**
 * Delete a builder resume/cover-letter project.
 * - type=resume → delete the document row
 * - type=cover_letter on a resume row → clear nested coverLetter only
 * - type=cover_letter on a cover_letter row → delete the row
 */
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const id = getRouterParam(event, 'id')
  const type = String(getQuery(event).type || '').trim()

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Document id is required' })
  }
  if (type !== 'resume' && type !== 'cover_letter') {
    throw createError({
      statusCode: 400,
      statusMessage: 'type must be resume or cover_letter',
    })
  }

  const result = await query<{
    id: string
    doc_type: string
    content_text: string
  }>(`SELECT id, doc_type, content_text FROM user_documents WHERE id = $1`, [id])

  const row = result.rows[0]
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  if (type === 'cover_letter' && row.doc_type === 'resume') {
    let parsed: BuilderResumeData
    try {
      parsed = JSON.parse(row.content_text) as BuilderResumeData
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid document content' })
    }
    delete parsed.coverLetter
    await query(
      `UPDATE user_documents
       SET content_text = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, JSON.stringify(parsed)],
    )
    return { deleted: 'cover_letter', id }
  }

  // Deleting a resume (or a standalone cover letter document) removes the row.
  // If deleting cover_letter but the row is a cover_letter type, delete the row.
  if (type === 'resume' || row.doc_type === 'cover_letter' || type === 'cover_letter') {
    await query(`DELETE FROM user_documents WHERE id = $1`, [id])
    return { deleted: type, id }
  }

  throw createError({ statusCode: 400, statusMessage: 'Unable to delete document' })
})
