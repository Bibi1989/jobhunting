import bcrypt from 'bcryptjs'
import { createUser, getUserByEmail, FREE_CREDITS, isDatabaseError } from '~/server/utils/db'
import { setAuthSession } from '~/server/utils/auth'

function errorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Registration failed'
  const e = error as {
    statusMessage?: string
    message?: string
    data?: { statusMessage?: string; message?: string }
    cause?: { message?: string }
  }
  return (
    e.data?.statusMessage ||
    e.statusMessage ||
    e.data?.message ||
    e.message ||
    e.cause?.message ||
    'Registration failed'
  )
}

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

  try {
    const existing = await getUserByEmail(email)
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await createUser({
      email,
      passwordHash,
      creditsRemaining: FREE_CREDITS,
    })

    return {
      user: await setAuthSession(event, user),
    }
  } catch (error: unknown) {
    // Re-throw intentional HTTP errors (validation / conflict / config)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = Number((error as { statusCode?: number }).statusCode)
      if (statusCode >= 400 && statusCode < 600) throw error
    }

    console.error('[auth/register] failed:', error)
    if (isDatabaseError(error)) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Database unavailable. Check DATABASE_URL / NUXT_DATABASE_URL on Netlify.',
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage(error).slice(0, 240),
    })
  }
})
