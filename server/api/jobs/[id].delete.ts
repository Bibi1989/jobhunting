import { requireUser } from '~/server/utils/auth'
import { deleteJob } from '../../utils/jobRepository'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  const queryParams = getQuery(event)
  const url = typeof queryParams.url === 'string' ? queryParams.url : undefined

  if (!id && !url) {
    throw createError({ statusCode: 400, statusMessage: 'Job id or url is required' })
  }

  try {
    const deleted = await deleteJob({
      userId: user.id,
      id: id && id !== 'by-url' ? id : undefined,
      url,
    })

    return { ok: true, deleted }
  } catch (error) {
    // Allow client-side removal even when Postgres is down.
    console.warn(
      'Could not delete job from database:',
      error instanceof Error ? error.message : error,
    )
    return { ok: true, deleted: false, localOnly: true }
  }
})
