import { query } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'
import type { BuilderResumeData } from '~/shared/types/builder'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<BuilderResumeData & { documentKind?: 'resume' | 'cover_letter' }>(event)
  const documentKind = body.documentKind === 'cover_letter' ? 'cover_letter' : 'resume'
  const { documentKind: _omit, ...data } = body
  const content = JSON.stringify(data)
  const name =
    body.name || (documentKind === 'cover_letter' ? 'Untitled Cover Letter' : 'Untitled Resume')

  const result = await query(
    `INSERT INTO user_documents (user_id, doc_type, original_name, mime_type, content_text)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [user.id, documentKind, name, 'application/json', content],
  )
  const newId = result.rows[0].id

  // Create initial version
  await query(
    `INSERT INTO user_document_versions (document_id, content_text, version_label)
     VALUES ($1, $2, $3)`,
    [newId, content, 'Initial Draft']
  )

  return { id: newId }
})
