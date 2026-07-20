import { requireUser } from '~/server/utils/auth'
import { getJobById } from '../../utils/jobRepository'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job id is required' })
  }

  const job = await getJobById(id, user.id)
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  return { job }
})
