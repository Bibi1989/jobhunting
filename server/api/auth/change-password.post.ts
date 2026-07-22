import bcrypt from 'bcryptjs'
import { requireUser, setAuthSession, invalidateAuthUserCache } from '~/server/utils/auth'
import { getUserById, invalidatePasswordResetTokens, updateUserPassword } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireUser(event)
  const body = await readBody<{ currentPassword?: string; newPassword?: string }>(event)
  const currentPassword = body?.currentPassword || ''
  const newPassword = body?.newPassword || ''

  if (!currentPassword || newPassword.length < 8 || newPassword.length > 200 || currentPassword.length > 200) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password and a new password (min 8 characters) are required',
    })
  }

  if (currentPassword === newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must be different from your current password.',
    })
  }

  const user = await getUserById(sessionUser.id)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 400, statusMessage: 'Current password is incorrect.' })
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  const updated = await updateUserPassword(user.id, passwordHash)
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update password' })
  }

  await invalidatePasswordResetTokens(user.id)
  invalidateAuthUserCache(user.id)

  return {
    ok: true,
    user: await setAuthSession(event, updated),
  }
})
