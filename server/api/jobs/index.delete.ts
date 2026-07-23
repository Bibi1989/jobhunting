import { requireUser } from '~/server/utils/auth'
import { deleteAllJobs } from '../../utils/jobRepository'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  try {
    const deleted = await deleteAllJobs(user.id)
    return { ok: true, deleted }
  } catch (err) {
    console.error('Could not delete all jobs from database:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not delete saved jobs',
    })
  }
})
