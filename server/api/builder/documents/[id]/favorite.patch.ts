import { requireUser } from '~/server/utils/auth'
import { query } from '~/server/utils/db'
import type { BuilderResumeData } from '~/shared/types/builder'

/**
 * PATCH /api/builder/documents/:id/favorite
 * Body: { type: 'resume' | 'cover_letter', isFavorite: boolean }
 *
 * - resume / cover_letter row → toggles user_documents.is_favorite
 * - cover_letter embedded in a resume JSON → toggles coverLetter.isFavorite
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Document id is required' })
  }

  const body = await readBody<{ type?: string; isFavorite?: boolean }>(event)
  const type = body?.type === 'cover_letter' ? 'cover_letter' : 'resume'
  const isFavorite = Boolean(body?.isFavorite)

  const result = await query<{
    id: string
    doc_type: string
    content_text: string
    is_favorite: boolean
  }>(
    `SELECT id, doc_type, content_text, COALESCE(is_favorite, FALSE) AS is_favorite
     FROM user_documents
     WHERE id = $1 AND user_id = $2 AND mime_type = 'application/json'`,
    [id, user.id],
  )

  const row = result.rows[0]
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  // Embedded cover letter on a resume document
  if (type === 'cover_letter' && row.doc_type === 'resume') {
    let parsed: BuilderResumeData
    try {
      parsed = JSON.parse(row.content_text) as BuilderResumeData
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid resume document' })
    }
    if (!parsed.coverLetter) {
      throw createError({ statusCode: 404, statusMessage: 'Cover letter not found on this resume' })
    }
    parsed.coverLetter = { ...parsed.coverLetter, isFavorite }
    await query(
      `UPDATE user_documents SET content_text = $3, updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, user.id, JSON.stringify(parsed)],
    )
    return { id, type, isFavorite }
  }

  await query(
    `UPDATE user_documents SET is_favorite = $3, updated_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [id, user.id, isFavorite],
  )

  return { id, type, isFavorite }
})
