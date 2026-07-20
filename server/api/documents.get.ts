import { getLatestDocuments } from '../utils/documents'

export default defineEventHandler(async () => {
  return getLatestDocuments()
})
