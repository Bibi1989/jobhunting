import { listRecentJobs } from '../../utils/jobRepository'

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event)
  const limit = Math.min(Number(queryParams.limit) || 100, 200)
  const jobs = await listRecentJobs(limit)
  return { jobs }
})
