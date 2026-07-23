import { createHash, randomBytes } from 'node:crypto'

const RESET_TTL_MS = 60 * 60 * 1000
const SENT_MESSAGE = 'Password reset instructions have been sent to your email.'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = body?.email?.trim().toLowerCase() || ''

  if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid email is required' })
  }

  const user = await getUserByEmail(email)
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No account found with that email address.',
    })
  }

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashResetToken(rawToken)
  const expiresAt = new Date(Date.now() + RESET_TTL_MS)
  await createPasswordResetToken(user.id, tokenHash, expiresAt)

  const config = useRuntimeConfig(event)
  const base = String(config.appUrl || 'http://localhost:3000').replace(/\/$/, '')
  const resetUrl = `${base}/reset-password?token=${encodeURIComponent(rawToken)}`

  const emailResult = await sendEmail({
    to: user.email,
    subject: 'Reset your JobFlow password',
    text: [
      'We received a request to reset your JobFlow password.',
      '',
      'Open this link to choose a new password (expires in 1 hour):',
      resetUrl,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
  })

  if (!emailResult.sent) {
    console.warn('[auth/forgot-password] email not sent:', emailResult.reason, resetUrl)
    throw createError({
      statusCode: 503,
      statusMessage: 'Could not send the reset email. Please try again later.',
    })
  }

  return { ok: true, message: SENT_MESSAGE }
})
