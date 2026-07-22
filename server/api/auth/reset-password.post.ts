import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { setAuthSession, invalidateAuthUserCache } from '~/server/utils/auth'
import { consumePasswordResetToken, invalidatePasswordResetTokens, updateUserPassword } from '~/server/utils/db'

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string; password?: string }>(event)
  const token = body?.token?.trim() || ''
  const password = body?.password || ''

  if (token.length < 20 || token.length > 200 || password.length < 8 || password.length > 200) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid reset token and password (min 8 characters) are required',
    })
  }

  const tokenHash = hashResetToken(token)
  const userId = await consumePasswordResetToken(tokenHash)

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This reset link is invalid or has expired. Request a new one.',
    })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await updateUserPassword(userId, passwordHash)
  if (!user) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update password' })
  }

  await invalidatePasswordResetTokens(userId)
  invalidateAuthUserCache(userId)

  return {
    ok: true,
    user: await setAuthSession(event, user),
  }
})
