import { requireUser } from '~/server/utils/auth'
import { query } from '../../utils/db'
import { getJobById, mapJobRow } from '../../utils/jobRepository'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job id is required' })
  }

  const body = await readBody<any>(event)

  // Verify job belongs to user
  const existing = await getJobById(id, user.id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  const result = await query(
    `UPDATE jobs SET
       title = $1,
       company = $2,
       location = $3,
       salary_min = $4,
       salary_max = $5,
       currency = $6,
       description = $7,
       responsibilities = $8,
       requirements = $9,
       updated_at = NOW()
     WHERE id = $10 AND user_id = $11
     RETURNING *`,
    [
      body.title ?? existing.title,
      body.company ?? existing.company ?? null,
      body.location ?? existing.location,
      body.salaryMin !== undefined ? body.salaryMin : (existing.salaryMin ?? null),
      body.salaryMax !== undefined ? body.salaryMax : (existing.salaryMax ?? null),
      body.currency ?? existing.currency ?? null,
      body.description ?? existing.description ?? null,
      body.responsibilities ?? existing.responsibilities ?? null,
      body.requirements ?? existing.requirements ?? null,
      id,
      user.id,
    ],
  )

  const updatedRow = result.rows[0]
  if (!updatedRow) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update job' })
  }

  return { job: mapJobRow(updatedRow as any) }
})
