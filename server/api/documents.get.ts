import { requireUser } from '~/server/utils/auth'
import { getLatestDocuments } from '../utils/documents'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return getLatestDocuments(user.id)
})
