import { query } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'
import type { BuilderResumeData } from '~/shared/types/builder'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const body = await readBody<BuilderResumeData & { documentKind?: 'resume' | 'cover_letter' }>(event)
  const documentKind = body.documentKind === 'cover_letter' ? 'cover_letter' : 'resume'
  const { documentKind: _omit, ...data } = body
  const content = JSON.stringify(data)
  const name =
    body.name || (documentKind === 'cover_letter' ? 'Untitled Cover Letter' : 'Untitled Resume')

  const result = await query(
    `INSERT INTO user_documents (doc_type, original_name, mime_type, content_text)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [documentKind, name, 'application/json', content],
  )

  return { id: result.rows[0].id }
})
