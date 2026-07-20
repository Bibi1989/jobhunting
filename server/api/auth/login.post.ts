import bcrypt from 'bcryptjs'
import { getUserByEmail, syncAdminRole } from '~/server/utils/db'
import { setAuthSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body?.email?.trim().toLowerCase()
  const password = body?.password || ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  const found = await getUserByEmail(email)
  if (!found) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const ok = await bcrypt.compare(password, found.passwordHash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const user = await syncAdminRole(found)

  return {
    user: await setAuthSession(event, user),
  }
})
