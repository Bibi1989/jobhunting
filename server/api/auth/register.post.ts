import bcrypt from 'bcryptjs'
import { createUser, getUserByEmail, FREE_CREDITS, isDatabaseError } from '~/server/utils/db'
import { setAuthSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body?.email?.trim().toLowerCase()
  const password = body?.password || ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email address' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters' })
  }

  const existing = await getUserByEmail(email)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  try {
    const user = await createUser({
      email,
      passwordHash,
      creditsRemaining: FREE_CREDITS,
    })

    return {
      user: await setAuthSession(event, user),
    }
  } catch (error: unknown) {
    console.error('[auth/register] failed:', error)
    if (isDatabaseError(error)) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Database unavailable. Check DATABASE_URL on the host.',
      })
    }
    const message = error instanceof Error ? error.message : 'Registration failed'
    throw createError({
      statusCode: 500,
      statusMessage: message.slice(0, 200),
    })
  }
})
